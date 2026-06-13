# AWS Secrets Manager
# Store sensitive configuration securely

resource "aws_secretsmanager_secret" "database_url" {
  name = "${var.project_name}/${var.environment}/database-url"

  tags = {
    Name = "${var.project_name}-${var.environment}-database-url"
  }
}

resource "aws_secretsmanager_secret_version" "database_url" {
  secret_id = aws_secretsmanager_secret.database_url.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password
    host     = var.environment == "production" ? aws_rds_cluster.main[0].endpoint : aws_db_instance.main[0].endpoint
    dbname   = "ohc_db"
    engine   = "postgres"
    port     = 5432
  })
}

resource "aws_secretsmanager_secret" "secret_key" {
  name = "${var.project_name}/${var.environment}/django-secret-key"

  tags = {
    Name = "${var.project_name}-${var.environment}-secret-key"
  }
}

resource "aws_secretsmanager_secret_version" "secret_key" {
  secret_id     = aws_secretsmanager_secret.secret_key.id
  secret_string = var.django_secret_key
}
