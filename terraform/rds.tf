# RDS PostgreSQL Database
# Staging: db.t3.micro, single-AZ (cheapest)
# Production: db.t3.small, Multi-AZ (recommended)

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${var.project_name}-${var.environment}-db-subnet-group"
  }
}

resource "aws_rds_cluster" "main" {
  # Skip RDS Cluster for staging - use single instance instead
  count = var.environment == "production" ? 1 : 0

  engine                = "aurora-postgresql"
  engine_version        = "15"
  database_name         = "ohc_db"
  master_username       = var.db_username
  master_password       = var.db_password
  db_cluster_instance_class = var.rds_instance_class

  storage_encrypted   = true
  kms_key_id          = var.kms_key_id

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = var.backup_retention_days
  preferred_backup_window = "03:00-04:00"

  skip_final_snapshot = var.environment == "staging"
  final_snapshot_identifier = var.environment == "production" ? "${var.project_name}-${var.environment}-final-snapshot" : null

  tags = {
    Name = "${var.project_name}-${var.environment}-aurora-cluster"
  }
}

# Single RDS Instance (for staging - cheaper)
resource "aws_db_instance" "main" {
  # Only create if NOT production (production uses Aurora cluster)
  count = var.environment == "staging" ? 1 : 0

  identifier = "${var.project_name}-${var.environment}-db"

  engine               = "postgres"
  engine_version       = "15"
  instance_class       = var.rds_instance_class_staging
  allocated_storage    = 20
  max_allocated_storage = 100

  db_name  = "ohc_db"
  username = var.db_username
  password = var.db_password

  storage_encrypted = true
  kms_key_id       = var.kms_key_id

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  multi_az                = false # Single AZ for staging to save money
  publicly_accessible     = false
  backup_retention_period = var.environment == "staging" ? var.backup_retention_days : 30
  backup_window           = "03:00-04:00"

  performance_insights_enabled = var.environment == "production"

  skip_final_snapshot             = var.environment == "staging"
  final_snapshot_identifier       = var.environment == "production" ? "${var.project_name}-${var.environment}-final-snapshot" : null
  delete_automated_backups        = var.environment == "staging"

  tags = {
    Name = "${var.project_name}-${var.environment}-db"
    Environment = var.environment
  }
}

# RDS Aurora Instances (for production)
resource "aws_rds_cluster_instance" "main" {
  count = var.environment == "production" ? 2 : 0

  identifier           = "${var.project_name}-${var.environment}-db-${count.index + 1}"
  cluster_identifier   = aws_rds_cluster.main[0].id
  instance_class       = var.rds_instance_class
  engine               = aws_rds_cluster.main[0].engine
  engine_version       = aws_rds_cluster.main[0].engine_version

  publicly_accessible = false

  performance_insights_enabled = true

  tags = {
    Name = "${var.project_name}-${var.environment}-db-instance-${count.index + 1}"
  }
}
