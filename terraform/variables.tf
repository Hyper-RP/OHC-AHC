# Terraform Variables

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "ohc-ahc"
}

variable "environment" {
  description = "Environment name (staging, production)"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be staging or production. Dev uses local docker-compose."
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

# VPC Configuration
variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

# ECS Configuration
variable "container_image" {
  description = "Docker container image URL"
  type        = string
}

variable "ecs_cpu" {
  description = "ECS task CPU units"
  type        = number
}

variable "ecs_memory" {
  description = "ECS task memory in MB"
  type        = number
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
}

# RDS Configuration
variable "db_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "rds_instance_class" {
  description = "RDS instance class for production"
  type        = string
  default     = "db.t3.small"
}

variable "rds_instance_class_staging" {
  description = "RDS instance class for staging"
  type        = string
  default     = "db.t3.micro"
}

variable "backup_retention_days" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
  default     = null
}

# Secrets
variable "django_secret_key" {
  description = "Django secret key"
  type        = string
  sensitive   = true
}

# SSL/TLS
variable "acm_certificate_arn" {
  description = "ACM certificate ARN for HTTPS — request in us-east-1 region"
  type        = string
}

# ── Monitoring & Alerting ──────────────────────────────────────────
variable "alert_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = "alerts@ohc-ahc.com"
}

# ── Security ───────────────────────────────────────────────────────
variable "cloudfront_secret_header" {
  description = "Secret value for X-CloudFront-Secret header — used to ensure ALB only accepts traffic from CloudFront"
  type        = string
  sensitive   = true
  default     = "change-me-generate-a-random-uuid"
}

variable "enable_waf" {
  description = "Enable WAF on CloudFront — production only (adds ~$5/month base cost)"
  type        = bool
  default     = false
}

# ── GitHub OIDC ────────────────────────────────────────────────────
variable "github_org" {
  description = "GitHub organization or username (e.g. my-org or my-username)"
  type        = string
  default     = ""
}

variable "github_repo" {
  description = "GitHub repository name (e.g. OHC-AHC)"
  type        = string
  default     = "OHC-AHC"
}
