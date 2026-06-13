# OHC-AHC - Occupational Health Compliance Application

A comprehensive Django + React application for managing employee health records, pre-employment checkups, and health dashboards.

## 🚀 Quick Start

### Local Development (Always $0)

```bash
# 1. Clone the repository
git clone <repo-url>
cd OHC-AHC

# 2. Set environment variables
cp .env.example .env
# Edit .env with your values

# 3. Start with Docker Compose
docker-compose up -d

# 4. Run migrations
docker-compose exec app python myproject/manage.py migrate

# 5. Create a superuser
docker-compose exec app python myproject/manage.py createsuperuser

# 6. Access the application
open http://localhost:8000
```

**🎯 Development is done locally with docker-compose - NOT on AWS.**

---

## 📋 Architecture

### Technology Stack

- **Backend**: Django 4.2+ (Python 3.11)
- **Frontend**: React 18+ (Vite)
- **Database**: PostgreSQL 15
- **Container**: Docker + Docker Compose
- **Production**: AWS ECS Fargate

### Project Structure

```
OHC-AHC/
├── frontend/              # React application
│   ├── src/              # Source code
│   └── vite.config.ts    # Vite configuration
├── myproject/            # Django application
│   ├── manage.py         # Django management
│   └── static/           # Collected React build
├── terraform/            # AWS infrastructure (staging + production)
└── docker-compose.yml    # Local development
```

---

## 🌍 Environments

| Environment | Platform | Monthly Cost | Purpose |
|-------------|----------|--------------|---------|
| **Development** | Local docker-compose | **$0** | Daily coding, testing |
| **Staging** | AWS (minimum specs) | **~$42/month** | QA, UAT, demos |
| **Production** | AWS (HA config) | **~$85/month** | Live users |

### Development Environment

**Cost: $0** - Run everything locally with docker-compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Staging Environment

**Cost: ~$42/month** - Cost-optimized AWS configuration

```bash
cd terraform
terraform plan -var-file="staging.tfvars"
terraform apply -var-file="staging.tfvars"
```

### Production Environment

**Cost: ~$85/month** - High-availability configuration

```bash
cd terraform
terraform plan -var-file="production.tfvars"
terraform apply -var-file="production.tfvars"
```

For detailed AWS architecture and cost breakdown, see [terraform/README.md](terraform/README.md).

---

## 🔧 Development Workflow

### 1. Frontend Development

```bash
cd frontend
npm install
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run lint         # Check code quality
```

### 2. Backend Development

```bash
docker-compose exec app python myproject/manage.py createsuperuser
docker-compose exec app python myproject/manage.py makemigrations
docker-compose exec app python myproject/manage.py migrate
docker-compose exec app python myproject/manage.py shell
```

### 3. Testing

```bash
# Backend tests
docker-compose exec app python myproject/manage.py test

# Frontend tests
cd frontend
npm run test
```

---

## 📦 Deployment

### Deploy to AWS Staging

```bash
# Build and push Docker image
docker build -t ohc-ahc:staging .
aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker tag ohc-ahc:staging <account>.dkr.ecr.us-east-1.amazonaws.com/ohc-ahc:staging
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/ohc-ahc:staging

# Deploy with Terraform
cd terraform
terraform apply -var-file="staging.tfvars"
```

### Deploy to AWS Production

```bash
# Same as staging but with production.tfvars
cd terraform
terraform apply -var-file="production.tfvars"
```

---

## 🔐 Security

- ✅ Environment variables for sensitive configuration
- ✅ Docker secrets for database credentials
- ✅ HTTPS enabled in production (ALB + CloudFront)
- ✅ RDS encryption at rest
- ✅ S3 Gateway Endpoint (free, secure)

---

## 📊 Key Features

### Employee Health Management
- Comprehensive health records
- Pre-employment checkups
- Health history tracking

### Dashboards
- Employee Health Summary Dashboard
- Graphical Health Analytics
- EHS (Environmental Health & Safety) Dashboard

### Reports
- Single employee ID lookup
- Health trend analysis
- Compliance reporting

---

## 🛠️ Troubleshooting

### Docker Issues

**Problem**: Container won't start
```bash
# Check logs
docker-compose logs app

# Rebuild from scratch
docker-compose down -v
docker-compose up -d --build
```

**Problem**: Database connection errors
```bash
# Check database status
docker-compose exec db pg_isready -U ohc_user

# Restart database
docker-compose restart db
```

### Terraform Issues

**Problem**: State lock error
```bash
# Force unlock (careful!)
terraform force-unlock <LOCK_ID>
```

**Problem**: AWS credentials not found
```bash
# Configure AWS CLI
aws configure
```

---

## 📚 Documentation

- [Terraform Infrastructure](terraform/README.md) - AWS architecture and costs
- [Deployment Checklist](docs/deployment/summary.md) - Pre-deployment requirements
- [API Documentation](docs/api/) - API endpoints and contracts

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test locally with docker-compose
4. Submit a pull request

---

## 📝 License

[Your License Here]

---

## Claude Code Sequential Workflow

Auto-runs 6 development phases in order. Each agent hands off output to the next.

### Setup (already done — this is for reference)
```bash
bash setup-claude-workflow.sh OHC-AHC
```

### Daily Use
```bash
claude                    # open Claude Code
/workflow-start           # begin Phase 1
/workflow-continue        # move to next phase
/workflow-status          # check progress
/workflow-pause           # save and exit
/workflow-resume          # pick up next session
```

### CLI State Manager
```bash
node .claude/scripts/workflow.js status        # show progress
node .claude/scripts/workflow.js start         # initialize
node .claude/scripts/workflow.js continue      # advance phase
node .claude/scripts/workflow.js goto 3        # jump to phase 3
node .claude/scripts/workflow.js reset         # start over
node .claude/scripts/workflow.js log "note"    # add session note
```
