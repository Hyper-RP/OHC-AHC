# ============================================
# Production Environment Configuration
# ============================================
# High-availability production environment
# Monthly cost: ~$85/month

environment = "production"
aws_region  = "us-east-1"

availability_zones = ["us-east-1a", "us-east-1b"]

# ============================================
# ECS Configuration
# ============================================
# 0.5 vCPU, 1GB RAM with 2 tasks for HA
# Cost: 0.5 vCPU × $0.025/hour × 730 hours × 2 tasks = ~$36.50/month
ecs_cpu            = 512     # 0.5 vCPU
ecs_memory         = 1024    # 1 GB
ecs_desired_count  = 2      # 2 tasks for high availability

# Container image (update with your ECR repository URL)
container_image = "YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/ohc-ahc:production"

# ============================================
# RDS Configuration (Aurora PostgreSQL)
# ============================================
# Aurora PostgreSQL db.t3.small, Multi-AZ, 2 instances
# Cost: ~$60/month
rds_instance_class = "db.t3.small"

# Backup retention: 30 days (production)
backup_retention_days = 30

# ============================================
# Secrets (NEVER commit real values here!)
# ============================================
# Pass these as environment variables before running terraform:
#
#   $env:TF_VAR_db_password      = "your_secure_password"
#   $env:TF_VAR_django_secret_key = "your_secret_key"
#
# The TF_VAR_ prefix tells Terraform to use environment variables.
# This way, secrets are NEVER written to files or version control.
db_username      = "ohc_admin"
# db_password   → set via: $env:TF_VAR_db_password = "..."
# django_secret_key → set via: $env:TF_VAR_django_secret_key = "..."

# ============================================
# SSL/TLS
# ============================================
# Get this from AWS Certificate Manager in us-east-1
acm_certificate_arn = "arn:aws:acm:us-east-1:YOUR_ACCOUNT_ID:certificate/YOUR_CERTIFICATE_ID"

# ============================================
# Monitoring & Alerts
# ============================================
alert_email = "your-email@example.com"  # CHANGE: receives alarm emails

# ============================================
# Security
# ============================================
# Generate with: python -c "import uuid; print(uuid.uuid4())"
cloudfront_secret_header = "CHANGE_ME_RANDOM_UUID_HERE"
enable_waf = true  # Enabled for production

# ============================================
# GitHub OIDC (Phase 8 — replace static keys)
# ============================================
github_org  = "YOUR_GITHUB_USERNAME_OR_ORG"
github_repo = "OHC-AHC"

# ============================================
# NOTES
# ============================================
# - CloudFront: ENABLED (CDN, DDoS protection)
# - NAT Gateway: 2 instances (multi-AZ for HA)
# - RDS: Aurora PostgreSQL Multi-AZ with 2 instances
# - ECS: 2 tasks for high availability
# - ALB: Cross-zone load balancing
# - S3 Gateway Endpoint: $0 (FREE)
#
# TOTAL MONTHLY COST: ~$85
#   - NAT Gateways (2): $65.70
#   - Data Processing: $4.50
#   - Aurora PostgreSQL: $60
#   - ECS Fargate (2 tasks): $36.50
#   - ALB: $18.75
#   - CloudFront: ~$10 (varies by traffic)
#   - CloudWatch Logs: ~$5
#   - Data Transfer: ~$10
