# ============================================
# Staging Environment Configuration
# ============================================
# Cost-optimized staging environment
# Monthly cost: ~$42/month

environment = "staging"
aws_region  = "us-east-1"

# ============================================
# ECS Configuration (Minimum Fargate size)
# ============================================
# Smallest Fargate: 0.25 vCPU, 0.5GB RAM
# Cost: 0.25 vCPU × $0.0125/hour × 730 hours = $9.12/month
ecs_cpu            = 256    # 0.25 vCPU (minimum)
ecs_memory         = 512    # 0.5 GB (minimum)
ecs_desired_count  = 1      # Single task for staging

# Container image (update with your ECR repository URL)
container_image = "819808778143.dkr.ecr.us-east-1.amazonaws.com/ohc-ahc-backend:latest"

# ============================================
# RDS Configuration (Cheapest option)
# ============================================
# db.t3.micro: 2 vCPU, 1GB RAM, single-AZ
# Cost: ~$15/month
rds_instance_class_staging = "db.t3.micro"

# Backup retention: Disabled (0) for staging to bypass Free Tier restrictions and speed up creation
backup_retention_days = 0

# ============================================
# Secrets (replace with actual values)
# ============================================
db_username      = "ohc_admin"
db_password      = "Rp302084Hash#"
django_secret_key = "fp!0d+#1u(x$1uliv()^%do_zdihj5&-yn)p4%zf5b6ol3h6n#"

# ============================================
# SSL/TLS
# ============================================
# Get this from AWS Certificate Manager in us-east-1
acm_certificate_arn = "arn:aws:acm:us-east-1:YOUR_ACCOUNT_ID:certificate/YOUR_CERTIFICATE_ID"

# ============================================
# Monitoring & Alerts
# ============================================
alert_email = "rp302084@gmail.com"  # CHANGE: receives alarm emails

# ============================================
# Security
# ============================================
# Generate with: python -c "import uuid; print(uuid.uuid4())"
cloudfront_secret_header = "9c8c03b4-cd5a-4f6f-b548-c86353955ec3"
enable_waf = false  # Disabled in staging to save cost

# ============================================
# GitHub OIDC (Phase 8 — replace static keys)
# ============================================
github_org  = "Hyper-RP"
github_repo = "OHC-AHC"

# ============================================
# NOTES
# ============================================
# - CloudFront: DISABLED (see alb.tf - production only)
# - NAT Gateway: 1 instance (single AZ for staging)
# - RDS: Single-AZ db.t3.micro
# - ECS: Smallest Fargate size
#
# TOTAL MONTHLY COST: ~$75
#   - NAT Gateway: $32.85
#   - Data Processing: $2.25
#   - RDS t3.micro: $15
#   - ECS Fargate: $9.12
#   - ALB: $18.75
#   - S3 bucket: ~$1
#   - S3 Gateway Endpoint: $0 (FREE)
#   - CloudWatch Logs: ~$2
#   - Container Insights: ~$2
#   - Data Transfer: ~$5
