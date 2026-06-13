# OHC-AHC — AWS Deployment Runbook

> Complete step-by-step guide to deploy the OHC-AHC project to AWS.
> Follow these phases **in order**. Each phase builds on the previous.

---

## 📋 Quick Reference

| Resource | Name |
|---|---|
| AWS Region | `us-east-1` |
| ECS Cluster | `ohc-ahc-{env}-cluster` |
| ECS Service | `ohc-ahc-{env}-service` |
| ECR Repo | `ohc-ahc-backend` |
| S3 Bucket | `ohc-ahc-{env}-static` |
| Terraform State S3 | `ohc-ahc-terraform-state` |
| DynamoDB Lock | `ohc-ahc-terraform-locks` |

---

## Phase 1 — Prerequisites

### 1.1 Install tools (Windows PowerShell)
```powershell
winget install Amazon.AWSCLI Hashicorp.Terraform
aws --version && terraform --version
```

### 1.2 Configure AWS credentials
```powershell
aws configure
# Enter: Access Key ID, Secret Access Key, Region (us-east-1), json
aws sts get-caller-identity  # Verify: shows your Account ID
```

### 1.3 Create Terraform backend (run ONCE, manual)
```powershell
# S3 bucket for Terraform state
aws s3 mb s3://ohc-ahc-terraform-state --region us-east-1
aws s3api put-bucket-versioning --bucket ohc-ahc-terraform-state --versioning-configuration Status=Enabled
aws s3api put-bucket-encryption --bucket ohc-ahc-terraform-state `
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
aws s3api put-public-access-block --bucket ohc-ahc-terraform-state `
  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# DynamoDB table for state locking
aws dynamodb create-table --table-name ohc-ahc-terraform-locks `
  --attribute-definitions AttributeName=LockID,AttributeType=S `
  --key-schema AttributeName=LockID,KeyType=HASH `
  --billing-mode PAY_PER_REQUEST --region us-east-1
```

### 1.4 Add GitHub Secrets
Go to GitHub → Settings → Secrets → New:
- `AWS_ACCESS_KEY_ID` — your IAM user access key
- `AWS_SECRET_ACCESS_KEY` — your IAM user secret key
- `VITE_API_BASE_URL` — e.g. `https://api.ohc-ahc.com`

---

## Phase 2 — Deploy Staging Infrastructure

### 2.1 Set sensitive variables (never write these in files!)
```powershell
$env:TF_VAR_db_password       = "YourSecurePassword123!"
$env:TF_VAR_django_secret_key = $(python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())")
$env:TF_VAR_cloudfront_secret_header = $(python -c "import uuid; print(uuid.uuid4())")
```

### 2.2 Update staging.tfvars
Edit `terraform/staging.tfvars`:
- `alert_email` → your real email address
- `github_org`  → your GitHub username or org
- `cloudfront_secret_header` → a random UUID (generate with Python above)

### 2.3 Initialize and deploy
```powershell
cd terraform
terraform init
terraform plan -var-file=staging.tfvars -out=staging.plan
# Review: look for "Plan: X to add, 0 to change, 0 to destroy"
terraform apply staging.plan
```

### 2.4 Save the outputs
```powershell
terraform output  # Save this entire output somewhere safe!
# Key values to note:
#   ecr_repository_url  → update GitHub Actions ECR_REPOSITORY
#   ecs_cluster_name    → update GitHub Actions ECS_CLUSTER
#   ecs_service_name    → update GitHub Actions ECS_SERVICE
#   ecs_task_family     → update GitHub Actions ECS_TASK_FAMILY
#   alb_dns_name        → point your domain here
```

---

## Phase 3 — Request SSL Certificate

> Do this BEFORE deploying production. Takes 5-30 minutes.

```powershell
# Request wildcard certificate (covers ohc-ahc.com AND *.ohc-ahc.com)
aws acm request-certificate `
  --domain-name "ohc-ahc.com" `
  --subject-alternative-names "*.ohc-ahc.com" `
  --validation-method DNS `
  --region us-east-1

# Output: CertificateArn — copy it!
# Then: AWS Console → ACM → Your cert → "Create records in Route 53" button
# Wait for Status: Issued (takes 5-30 minutes)
```

---

## Phase 4 — Store Secrets in AWS Secrets Manager

```powershell
# Get DB endpoint from terraform output
$DB_ENDPOINT = terraform output -raw database_endpoint

# Store DATABASE_URL
aws secretsmanager put-secret-value `
  --secret-id "ohc-ahc/staging/database-url" `
  --secret-string "postgres://ohc_admin:$env:TF_VAR_db_password@${DB_ENDPOINT}:5432/ohc_db"

# Store Django SECRET_KEY
aws secretsmanager put-secret-value `
  --secret-id "ohc-ahc/staging/django-secret-key" `
  --secret-string $env:TF_VAR_django_secret_key

# Verify secrets are stored
aws secretsmanager list-secrets --filter "Key=name,Values=ohc-ahc"
```

---

## Phase 5 — First Docker Image Push

```powershell
# Get values from terraform output
$AWS_ACCOUNT_ID = aws sts get-caller-identity --query Account --output text
$ECR_URL = "$AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com"
$ECR_REPO = terraform output -raw ecr_repository_url

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_URL

# Build and push first image
docker build -t ohc-ahc-backend .
docker tag ohc-ahc-backend:latest $ECR_REPO:latest
docker push $ECR_REPO:latest

# Verify it's in ECR
aws ecr describe-images --repository-name ohc-ahc-backend --region us-east-1
```

---

## Phase 6 — Configure Route 53 DNS

```powershell
$ALB_DNS = terraform output -raw alb_dns_name
$ALB_ZONE_ID = terraform output -raw alb_zone_id

# Create Route 53 hosted zone
aws route53 create-hosted-zone `
  --name "ohc-ahc.com" `
  --caller-reference "$(Get-Date -Format 'yyyyMMddHHmmss')"
# Note the HostedZoneId from the output!

# Create alias A record: api.ohc-ahc.com → ALB
# Replace HOSTED_ZONE_ID and ACCOUNT_ALB_ZONE_ID with your values
aws route53 change-resource-record-sets `
  --hosted-zone-id "YOUR_HOSTED_ZONE_ID" `
  --change-batch "{
    `"Changes`": [{
      `"Action`": `"CREATE`",
      `"ResourceRecordSet`": {
        `"Name`": `"api.ohc-ahc.com`",
        `"Type`": `"A`",
        `"AliasTarget`": {
          `"HostedZoneId`": `"$ALB_ZONE_ID`",
          `"DNSName`": `"$ALB_DNS`",
          `"EvaluateTargetHealth`": true
        }
      }
    }]
  }"
```

---

## Phase 7 — Update GitHub Actions with Real Values

After `terraform output`, update these values in `.github/workflows/deploy.yml`:

```yaml
env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: ohc-ahc-backend        # from ecr_repository_url (just the repo name)
  ECS_CLUSTER: ohc-ahc-production-cluster # from ecs_cluster_name
  ECS_SERVICE: ohc-ahc-production-service # from ecs_service_name
  ECS_TASK_FAMILY: ohc-ahc-production-app # from ecs_task_family
```

Then push to main to trigger your first automated deployment!

---

## Phase 8 — Production Deployment

```powershell
# Set production secrets
$env:TF_VAR_db_password = "ProductionSecurePassword!"
$env:TF_VAR_django_secret_key = $(python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())")
$env:TF_VAR_cloudfront_secret_header = $(python -c "import uuid; print(uuid.uuid4())")

# Update production.tfvars
# - Set acm_certificate_arn with your certificate ARN
# - Set container_image with your ECR URL
# - Set alert_email, github_org, github_repo

# Deploy production
terraform plan -var-file=production.tfvars -out=production.plan
terraform apply production.plan
```

---

## Phase 9 — OIDC Setup (Remove Static Keys)

```powershell
# After terraform apply, get the GitHub Actions role ARN
$ROLE_ARN = terraform output -raw github_actions_role_arn
echo "Add this to your workflow: $ROLE_ARN"
```

Update `.github/workflows/deploy.yml`:
```yaml
# Replace:
#   aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
#   aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
# With:
          role-to-assume: arn:aws:iam::YOUR_ACCOUNT:role/ohc-ahc-github-actions-role
```

Then delete GitHub Secrets `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.

---

## Common Commands — Day to Day

### View application logs
```powershell
# Last 100 log lines (live tail)
aws logs tail /ecs/ohc-ahc-production --follow --region us-east-1

# Search for errors
aws logs filter-log-events `
  --log-group-name /ecs/ohc-ahc-production `
  --filter-pattern ERROR `
  --region us-east-1
```

### Execute a command inside a running container
```powershell
# Get the running task ARN
$TASK_ARN = aws ecs list-tasks --cluster ohc-ahc-production-cluster `
  --service-name ohc-ahc-production-service `
  --query 'taskArns[0]' --output text

# Open Django shell inside the container
aws ecs execute-command `
  --cluster ohc-ahc-production-cluster `
  --task $TASK_ARN `
  --container ohc-app `
  --command "python manage.py shell" `
  --interactive

# Run a one-off migration
aws ecs execute-command `
  --cluster ohc-ahc-production-cluster `
  --task $TASK_ARN `
  --container ohc-app `
  --command "python manage.py migrate --noinput" `
  --interactive
```

### Force a redeployment (without code change)
```powershell
aws ecs update-service `
  --cluster ohc-ahc-production-cluster `
  --service ohc-ahc-production-service `
  --force-new-deployment `
  --region us-east-1
```

### Check ECS service events (for debugging failed deploys)
```powershell
aws ecs describe-services `
  --cluster ohc-ahc-production-cluster `
  --services ohc-ahc-production-service `
  --query 'services[0].events[:10]' `
  --output table
```

### Manual rollback (use previous image tag)
```powershell
# List recent images in ECR
aws ecr describe-images --repository-name ohc-ahc-backend `
  --query 'sort_by(imageDetails,&imagePushedAt)[-5:].imageTags' `
  --output table

# Deploy a specific image tag
aws ecs update-service `
  --cluster ohc-ahc-production-cluster `
  --service ohc-ahc-production-service `
  --task-definition ohc-ahc-production-app:PREVIOUS_REVISION_NUMBER `
  --force-new-deployment
```

### Tear down staging to save money (when not needed)
```powershell
cd terraform
terraform destroy -var-file=staging.tfvars
# Type "yes" — this DELETES everything in staging
```

---

## ⚠️ Production Checklist Before Go-Live

- [ ] ACM certificate Status = `Issued`
- [ ] Route 53 A record → ALB (confirmed with `nslookup api.ohc-ahc.com`)
- [ ] `https://api.ohc-ahc.com/health/` returns HTTP 200
- [ ] SNS email subscription confirmed (check inbox!)
- [ ] CloudWatch alarms in `OK` state (not `ALARM`)
- [ ] ECS service shows `ACTIVE` with `runningCount >= 2`
- [ ] RDS instance is `available`
- [ ] Secrets Manager has `DATABASE_URL` and `SECRET_KEY` for production
- [ ] Django `DEBUG=False` in production task definition
- [ ] `ALLOWED_HOSTS` set to your real domain
- [ ] CORS origins set to your real frontend domain
- [ ] CloudFront distribution `Deployed` (not `InProgress`)
