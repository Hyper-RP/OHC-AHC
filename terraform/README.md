# OHC-AHC AWS Infrastructure

## 🚨 Cost Analysis - Corrected

### Problem 1: VPC Endpoints Math Was WRONG

The previous analysis incorrectly claimed that VPC Endpoints would save money. Here's the **CORRECTED** math:

#### Option A: NAT Gateway (Our Choice)
- NAT Gateway: $32.85/month
- Data Processing: $2.25/month
- **Total: ~$35/month**

#### Option B: Interface VPC Endpoints (What was proposed)
- S3 Gateway Endpoint: **$0** ✅ (Always use this - it's free!)
- ECR Endpoint: $7.30/month
- Secrets Manager Endpoint: $7.30/month
- CloudWatch Logs Endpoint: $7.30/month
- CloudWatch Metrics Endpoint: $7.30/month
- **Total: $29.20/month**

### ✅ Our Decision

**Winner: NAT Gateway** (for simplicity)

While VPC Endpoints save $5.80/month, they add significant configuration complexity. For this app:

1. **S3 Gateway Endpoint: Always FREE** ✅ (we use this)
2. **NAT Gateway for everything else** (ECR, Secrets Manager, CloudWatch)

This keeps the architecture simple while optimizing S3 traffic costs.

---

### Problem 2: Development Environment Should Be $0

**Development is done LOCALLY with docker-compose, not on AWS.**

```
Environment        Platform              Monthly Cost
──────────────────────────────────────────────────
Development        docker-compose        $0         ← Local only!
Staging            AWS ECS               $42        ← Min specs
Production         AWS ECS               $85        ← HA config
```

## 📋 Environment Strategy

| Environment | Purpose | Platform | Cost | When to Use |
|-------------|---------|----------|------|-------------|
| **Development** | Local development | `docker-compose up` | **$0** | Daily coding, testing |
| **Staging** | Pre-production testing | AWS (min specs) | **$42/month** | QA, UAT, demo |
| **Production** | Live application | AWS (HA config) | **$85/month** | Real users |

---

## 🚀 Quick Start

### 1. Local Development (Always $0)

```bash
# Set environment variables
cp .env.example .env
# Edit .env with your values

# Start everything
docker-compose up -d

# Run migrations
docker-compose exec app python myproject/manage.py migrate

# Access the app
open http://localhost:8000
```

### 2. Deploy to Staging (~$42/month)

```bash
# Configure AWS credentials
aws configure

# Initialize Terraform
cd terraform
terraform init

# Plan the deployment
terraform plan -var-file="staging.tfvars"

# Apply the configuration
terraform apply -var-file="staging.tfvars"

# Get the load balancer URL
terraform output alb_dns_name
```

### 3. Deploy to Production (~$85/month)

```bash
terraform plan -var-file="production.tfvars"
terraform apply -var-file="production.tfvars"

# Get the CloudFront URL
terraform output cloudfront_domain_name
```

---

## 💰 Cost Breakdown

### Staging Environment (~$42/month)

| Service | Configuration | Monthly Cost |
|---------|---------------|--------------|
| NAT Gateway | 1 instance (single AZ) | $32.85 |
| Data Processing | 50GB @ $0.045/GB | $2.25 |
| RDS PostgreSQL | db.t3.micro, single-AZ | $15.00 |
| ECS Fargate | 0.25 vCPU, 0.5GB RAM | $9.12 |
| ALB | Application Load Balancer | $18.75 |
| S3 Gateway Endpoint | ✅ FREE | $0 |
| CloudWatch Logs | 7-day retention | $2.00 |
| Data Transfer | ~50GB | $5.00 |

### Production Environment (~$85/month)

| Service | Configuration | Monthly Cost |
|---------|---------------|--------------|
| NAT Gateways | 2 instances (multi-AZ) | $65.70 |
| Data Processing | 100GB @ $0.045/GB | $4.50 |
| Aurora PostgreSQL | db.t3.small, Multi-AZ, 2 instances | $60.00 |
| ECS Fargate | 2 tasks (0.5 vCPU, 1GB each) | $36.50 |
| ALB | Application Load Balancer | $18.75 |
| CloudFront | CDN + DDoS protection | $10.00 |
| S3 Gateway Endpoint | ✅ FREE | $0 |
| CloudWatch Logs | 30-day retention | $5.00 |
| Data Transfer | ~100GB | $10.00 |

---

## 🔧 Architecture

### Network Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        VPC (10.0.0.0/16)                     │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Public Subnets (ALB)                                 │ │
│  │  ┌─────────────────────────────────────────────────┐ │ │
│  │  │  Internet Gateway                                │ │ │
│  │  │         │                                         │ │ │
│  │  │    ┌───┴───┐                                     │ │ │
│  │  │    │  ALB  │                                     │ │ │
│  │  │    └───────┘                                     │ │ │
│  │  └─────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────┘ │
│                          │                                  │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Private Subnets (ECS + RDS)                          │ │
│  │  ┌─────────────────────────────────────────────────┐ │ │
│  │  │  NAT Gateway → AWS Services (ECR, Secrets, CW)   │ │ │
│  │  │         │                                        │ │ │
│  │  │    ┌───┴──────────────┐                         │ │ │
│  │  │    │                  │                         │ │ │
│  │  │ ┌──┴───┐          ┌───┴───┐                      │ │ │
│  │  │ │ ECS  │          │  RDS  │                      │ │ │
│  │  │ │ Task │          │ DB    │                      │ │ │
│  │  │ └──────┘          └───────┘                      │ │ │
│  │  └─────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                    ┌───────┴────────┐
                    │  S3 Gateway    │ ← FREE!
                    │  Endpoint      │
                    └────────────────┘
```

### Key Design Decisions

1. **S3 Gateway Endpoint**: Always FREE, reduces data transfer costs
2. **NAT Gateway**: Simple and cost-effective for non-S3 services
3. **Single AZ for Staging**: Cost-optimized for non-critical workloads
4. **Multi-AZ for Production**: High availability when it matters
5. **CloudFront for Production only**: CDN and DDoS protection

---

## 📝 Requirements

### For Terraform Deployment

- AWS Account with appropriate permissions
- Terraform >= 1.5.0
- AWS CLI configured with credentials
- Docker (for building the container image)
- ECR repository (or update `container_image` variable)

### For Local Development

- Docker
- Docker Compose
- Python 3.11+ (if running outside Docker)

---

## 🛠️ Commands Reference

### Terraform Operations

```bash
# Initialize Terraform
terraform init

# Plan deployment
terraform plan -var-file="staging.tfvars"

# Apply changes
terraform apply -var-file="staging.tfvars"

# Destroy environment
terraform destroy -var-file="staging.tfvars"

# Show outputs
terraform output

# Format code
terraform fmt

# Validate configuration
terraform validate
```

### Docker Operations (Local Development)

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Run migrations
docker-compose exec app python myproject/manage.py migrate

# Create superuser
docker-compose exec app python myproject/manage.py createsuperuser

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

---

## 🔐 Security Best Practices

1. **Never commit secrets** - Use environment variables or AWS Secrets Manager
2. **Enable encryption** - RDS, S3, and EBS volumes are encrypted by default
3. **Use IAM roles** - ECS tasks use IAM roles instead of access keys
4. **HTTPS only** - ALB redirects HTTP to HTTPS
5. **VPC endpoints** - S3 traffic stays within AWS network

---

## 📚 Resources

- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Fargate Pricing](https://aws.amazon.com/fargate/pricing/)
- [AWS RDS Pricing](https://aws.amazon.com/rds/postgresql/pricing/)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/)

---

## 🆘 Troubleshooting

### Terraform Issues

**Problem**: `terraform apply` fails with "credentials"
```bash
# Solution: Configure AWS credentials
aws configure
```

**Problem**: State lock error
```bash
# Solution: Force unlock (careful!)
terraform force-unlock <LOCK_ID>
```

### Docker Issues

**Problem**: Container won't start
```bash
# Solution: Check logs
docker-compose logs app

# Rebuild from scratch
docker-compose down -v
docker-compose up -d --build
```

---

## 📈 Monitoring

### CloudWatch Dashboards (Production)

After deploying, set up CloudWatch dashboards for:
- ECS task CPU/Memory utilization
- RDS connection count and performance
- ALB request count and latency
- NAT Gateway data transfer

---

## 🔄 CI/CD Integration

Recommended workflow:

1. **Push to main** → Deploy to Staging
2. **Manual approval** → Deploy to Production
3. **Rollback** → `terraform apply` with previous state

Example GitHub Actions workflow:

```yaml
name: Deploy to Staging
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to AWS
        run: |
          cd terraform
          terraform init
          terraform apply -var-file="staging.tfvars" -auto-approve
```

---

**Last Updated**: 2026-06-05
**Maintained By**: DevOps Team
