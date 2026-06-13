# ================================================================
# terraform/ecr.tf
# Amazon Elastic Container Registry — Private Docker Image Storage
# ================================================================
# What is ECR?
#   ECR is AWS's private Docker Hub. Your GitHub Actions pipeline
#   builds a Docker image and pushes it here. When ECS deploys,
#   it pulls the image from here.
#
# Why not Docker Hub?
#   1. Stays inside AWS network (faster, no egress costs)
#   2. Private by default (only your AWS account can access it)
#   3. Integrated with ECS — no extra credentials needed
# ================================================================

resource "aws_ecr_repository" "backend" {
  name                 = "${var.project_name}-backend"
  image_tag_mutability = "MUTABLE"
  # MUTABLE means you can overwrite the "latest" tag.
  # IMMUTABLE would require a unique tag per push — safer but more complex.

  # Automatically scan images for security vulnerabilities when pushed
  # You'll see results in ECR console → Repositories → Images → Vulnerabilities
  image_scanning_configuration {
    scan_on_push = true
  }

  # Encrypt images at rest using AES-256
  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-ecr"
  }
}

# ── ECR Repository Policy ──────────────────────────────────────────
# Allow ECS tasks to pull images from this repository
resource "aws_ecr_repository_policy" "backend" {
  repository = aws_ecr_repository.backend.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowECSPull"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability"
        ]
      }
    ]
  })
}

# ── Lifecycle Policy — Automatic Image Cleanup ─────────────────────
# Without this, old images accumulate forever and you pay for storage.
# With this, AWS automatically deletes old images.
resource "aws_ecr_lifecycle_policy" "backend" {
  repository = aws_ecr_repository.backend.name

  policy = jsonencode({
    rules = [
      {
        # Rule 1: Keep only the last 10 tagged images
        # Any tagged image beyond the 10 most recent is deleted
        rulePriority = 1
        description  = "Keep last 10 tagged images"
        selection = {
          tagStatus   = "tagged"
          tagPrefixList = ["latest", "sha-"]
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = {
          type = "expire"
        }
      },
      {
        # Rule 2: Delete untagged images after 1 day
        # Untagged images = failed builds, intermediate layers
        rulePriority = 2
        description  = "Remove untagged images after 1 day"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 1
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
