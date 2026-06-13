# ================================================================
# terraform/iam_github.tf
# GitHub Actions OIDC — Passwordless AWS Authentication
# ================================================================
# What problem does this solve?
#   Currently, your GitHub Actions workflow uses static AWS access keys
#   stored as GitHub Secrets. If those secrets are ever exposed
#   (leaked logs, compromised repo), an attacker has PERMANENT AWS access.
#
# How OIDC fixes this:
#   GitHub issues a short-lived token (valid ~15 minutes) for each job.
#   AWS verifies the token came from YOUR specific repo/branch.
#   No static secrets needed at all!
#
# Think of it like this:
#   Old way: Give GitHub a permanent key to your house
#   OIDC:    GitHub shows a verified ID, gets a temp key that expires
#
# After applying this:
#   1. Delete AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY from GitHub Secrets
#   2. Update the workflow "Configure AWS credentials" step to use role-to-assume
# ================================================================

# ── OIDC Provider ────────────────────────────────────────────────
# This registers GitHub as a trusted identity provider in your AWS account.
# AWS needs to know "I trust tokens signed by GitHub Actions"
# (It's okay to have only one per AWS account — it's shared)
resource "aws_iam_openid_connect_provider" "github" {
  # If it already exists in your AWS account, import it using:
  # terraform import aws_iam_openid_connect_provider.github arn:aws:iam::<YOUR_ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com

  url = "https://token.actions.githubusercontent.com"

  # AWS needs to know which services (audiences) can use this provider
  client_id_list = ["sts.amazonaws.com"]

  # The thumbprint is GitHub's certificate fingerprint — AWS uses this to verify
  # tokens actually come from GitHub (not someone pretending to be GitHub)
  # This thumbprint is GitHub's well-known value (doesn't change often)
  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1c58a3a8518e8759bf075b76b750d4f2df264fcd"
  ]

  tags = {
    Name = "github-actions-oidc"
  }
}

# ── IAM Role for GitHub Actions ──────────────────────────────────
# This role is what GitHub Actions "assumes" during CI/CD runs
# The trust policy below restricts which GitHub repos can assume this role
resource "aws_iam_role" "github_actions" {
  name        = "${var.project_name}-github-actions-role"
  description = "Role assumed by GitHub Actions via OIDC for CI/CD deployments"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            # Only tokens from YOUR specific repo can use this role
            # Format: repo:<org-or-user>/<repo-name>:ref:refs/heads/<branch>
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            # Allow from main branch (change to restrict further)
            # "repo:myorg/myrepo:ref:refs/heads/main" = only main branch
            # "repo:myorg/myrepo:*"                   = any branch in repo
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_org}/${var.github_repo}:*"
          }
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-github-actions-role"
  }
}

# ── Permissions Policy ───────────────────────────────────────────
# LEAST PRIVILEGE: only give GitHub Actions exactly what it needs
# Not AdministratorAccess — only specific actions for CI/CD
resource "aws_iam_role_policy" "github_actions" {
  name = "${var.project_name}-github-actions-policy"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # ECR: Push Docker images to ECR
        Sid    = "ECRPush"
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",           # Login to ECR
          "ecr:BatchCheckLayerAvailability",     # Check which layers already exist
          "ecr:InitiateLayerUpload",             # Start uploading a layer
          "ecr:UploadLayerPart",                 # Upload a chunk of a layer
          "ecr:CompleteLayerUpload",             # Finish uploading a layer
          "ecr:PutImage",                        # Push the final image
          "ecr:DescribeRepositories",            # List repositories
          "ecr:DescribeImages",                  # List images in a repo
          "ecr:BatchDeleteImage"                 # Clean up old images
        ]
        Resource = "*"
      },
      {
        # ECS: Deploy new versions of the service
        Sid    = "ECSDeployment"
        Effect = "Allow"
        Action = [
          "ecs:UpdateService",                   # Update service to use new task def
          "ecs:DescribeServices",                # Check service status
          "ecs:DescribeTasks",                   # Check task status
          "ecs:DescribeTaskDefinition",          # Get current task definition
          "ecs:RegisterTaskDefinition",          # Register updated task definition
          "ecs:RunTask",                         # Run one-shot tasks (for migrations)
          "ecs:ListTasks"                        # List running tasks
        ]
        Resource = "*"
      },
      {
        # CloudFront: Invalidate cache after deployment
        Sid    = "CloudFrontInvalidation"
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation",       # Invalidate cached files
          "cloudfront:ListDistributions",        # Find the distribution ID
          "cloudfront:GetDistribution"           # Get distribution details
        ]
        Resource = "*"
      },
      {
        # IAM: Allow passing the ECS task roles (needed for RunTask/UpdateService)
        Sid    = "IAMPassRole"
        Effect = "Allow"
        Action = ["iam:PassRole"]
        Resource = [
          aws_iam_role.ecs_execution_role.arn,
          aws_iam_role.ecs_task_role.arn
        ]
      },
      {
        # EC2: Needed to find subnet and security group IDs for migration task
        Sid    = "EC2Describe"
        Effect = "Allow"
        Action = [
          "ec2:DescribeSubnets",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeVpcs"
        ]
        Resource = "*"
      },
      {
        # Logs: Read deployment logs for debugging
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:GetLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

