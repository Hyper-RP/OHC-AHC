# ================================================================
# ECS Fargate Configuration
# Staging:    0.25 vCPU, 0.5GB RAM (minimum Fargate)
# Production: 0.5 vCPU, 1GB RAM with 2 tasks for high availability
# ================================================================

resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-${var.environment}-cluster"

  # Container Insights = detailed metrics in CloudWatch (CPU, memory per task)
  # Costs ~$0.50/GB of metrics data — enabled for both envs for better visibility
  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-cluster"
  }
}

# ECS Task Execution Role
resource "aws_iam_role" "ecs_execution_role" {
  name = "${var.project_name}-${var.environment}-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-ecs-execution-role"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS Task Role (for app to access AWS services like S3, Secrets Manager)
# This is DIFFERENT from the execution role:
#   Execution role = ECS agent pulling images and secrets at STARTUP
#   Task role      = YOUR APPLICATION code accessing AWS services at RUNTIME
resource "aws_iam_role" "ecs_task_role" {
  name = "${var.project_name}-${var.environment}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-ecs-task-role"
  }
}

# ── Task Role Permissions — What your app can access ──────────────
# Each permission is scoped to ONLY what this app needs (least privilege)
resource "aws_iam_role_policy" "ecs_task_permissions" {
  name = "${var.project_name}-${var.environment}-task-permissions"
  role = aws_iam_role.ecs_task_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # Allow Django app to read/write files to S3
        # Needed for: django-storages to save media uploads and serve static files
        Sid    = "S3StaticAndMedia"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = [
          "arn:aws:s3:::${var.project_name}-${var.environment}-static",
          "arn:aws:s3:::${var.project_name}-${var.environment}-static/*"
        ]
      },
      {
        # Allow app to read secrets from Secrets Manager
        # Needed for: DATABASE_URL, SECRET_KEY at runtime
        Sid    = "SecretsManagerRead"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          "arn:aws:secretsmanager:${var.aws_region}:*:secret:${var.project_name}/${var.environment}/*"
        ]
      },
      {
        # Allow app to write logs to CloudWatch
        # Needed for: application-level logging beyond container stdout
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = [
          "arn:aws:logs:${var.aws_region}:*:log-group:/ecs/${var.project_name}-${var.environment}:*"
        ]
      }
    ]
  })
}

# ── SSM Session Manager — for ECS Exec (SSH into containers) ──────
# Allows you to run: aws ecs execute-command --cluster ... --command /bin/bash
# Useful for debugging: check logs, run Django shell, inspect files
resource "aws_iam_role_policy_attachment" "ecs_task_ssm" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# CloudWatch Logs
resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/${var.project_name}-${var.environment}"
  retention_in_days = var.environment == "staging" ? 7 : 30

  tags = {
    Name = "${var.project_name}-${var.environment}-logs"
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "app" {
  family                   = "${var.project_name}-${var.environment}-app"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.ecs_cpu
  memory                   = var.ecs_memory
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "ohc-app"
      image     = var.container_image
      essential = true

      portMappings = [
        {
          containerPort = 8000
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "DJANGO_SETTINGS_MODULE"
          value = "myproject.settings"
        },
        {
          name  = "DEBUG"
          value = var.environment == "staging" ? "True" : "False"
        },
        {
          name  = "DJANGO_ALLOWED_HOSTS"
          value = aws_lb.main.dns_name
        }
      ]

      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = aws_secretsmanager_secret.database_url.arn
        },
        {
          name      = "SECRET_KEY"
          valueFrom = aws_secretsmanager_secret.secret_key.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "app"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:8000/health/ || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name = "${var.project_name}-${var.environment}-task-def"
  }
}

# ECS Service
resource "aws_ecs_service" "app" {
  name            = "${var.project_name}-${var.environment}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.ecs_desired_count
  launch_type     = "FARGATE"

  # ── Enable ECS Exec ─────────────────────────────────────────────
  # Allows running commands inside running containers for debugging:
  # aws ecs execute-command --cluster <cluster> --task <task-id> \
  #   --container ohc-app --command "/bin/bash" --interactive
  enable_execute_command = true

  network_configuration {
    # Staging: public subnets + public IP → tasks reach internet directly, no NAT needed
    # Production: private subnets + no public IP → traffic routed through NAT Gateway
    subnets          = var.environment == "staging" ? aws_subnet.public[*].id : aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = var.environment == "staging" ? true : false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.main.arn
    container_name   = "ohc-app"
    container_port   = 8000
  }

  # ── Deployment Circuit Breaker ──────────────────────────────────
  # Without this: a bad deployment retries endlessly, eventually
  # replacing all healthy tasks with broken ones → full outage.
  # With this: if the new tasks keep failing health checks, AWS
  # automatically rolls back to the last working version.
  deployment_circuit_breaker {
    enable   = true
    rollback = true  # Auto-rollback on failure
  }

  # Deployment settings: maximum healthy tasks during rolling update
  deployment_maximum_percent         = 200  # Can have 200% tasks during deploy
  deployment_minimum_healthy_percent = 100  # Always keep 100% healthy tasks running

  # Ignore desired_count changes from Terraform if auto-scaling changed it
  # (Auto-scaling manages desired count at runtime)
  lifecycle {
    ignore_changes = [desired_count]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-service"
  }
}
