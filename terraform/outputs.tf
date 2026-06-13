# Terraform Outputs

output "alb_dns_name" {
  description = "DNS name of the load balancer — point your Route 53 alias to this"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the load balancer — needed for Route 53 alias records"
  value       = aws_lb.main.zone_id
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster — use in GitHub Actions env.ECS_CLUSTER"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Name of the ECS service — use in GitHub Actions env.ECS_SERVICE"
  value       = aws_ecs_service.app.name
}

output "ecs_task_family" {
  description = "ECS task definition family name — use in GitHub Actions env.ECS_TASK_FAMILY"
  value       = aws_ecs_task_definition.app.family
}

output "ecr_repository_url" {
  description = "ECR repository URL — use in GitHub Actions env.ECR_REPOSITORY and Terraform container_image variable"
  value       = aws_ecr_repository.backend.repository_url
}

output "s3_bucket_name" {
  description = "S3 bucket name — add as AWS_S3_BUCKET in Django settings"
  value       = aws_s3_bucket.static.id
}

output "database_endpoint" {
  description = "RDS database endpoint — use in DATABASE_URL secret"
  value       = var.environment == "production" ? aws_rds_cluster.main[0].endpoint : aws_db_instance.main[0].endpoint
  sensitive   = true
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (production only) — use in GitHub Actions for cache invalidation"
  value       = var.environment == "production" ? aws_cloudfront_distribution.main[0].id : null
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name (production only) — use as your CNAME target"
  value       = var.environment == "production" ? aws_cloudfront_distribution.main[0].domain_name : null
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs — use in GitHub Actions for migration tasks"
  value       = aws_subnet.private[*].id
}

output "ecs_security_group_id" {
  description = "ECS security group ID — use in GitHub Actions for migration tasks"
  value       = aws_security_group.ecs.id
}

output "github_actions_role_arn" {
  description = "GitHub Actions OIDC role ARN — copy to workflow as role-to-assume after Phase 8"
  value       = aws_iam_role.github_actions.arn
}

output "sns_alerts_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarms — check your email to confirm subscription"
  value       = aws_sns_topic.alerts.arn
}

output "cloudwatch_dashboard_url" {
  description = "Direct link to CloudWatch dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${var.project_name}-${var.environment}"
}

output "next_steps" {
  description = "Post-deployment action items"
  value = {
    "1_confirm_email"     = "Check your email (${var.alert_email}) and click the SNS subscription confirmation link"
    "2_update_github"     = "Update GitHub Actions ECS_CLUSTER, ECS_SERVICE, ECS_TASK_FAMILY env vars to match outputs above"
    "3_store_secrets"     = "Run: aws secretsmanager put-secret-value --secret-id ohc-ahc/${var.environment}/database-url --secret-string '...'"
    "4_first_image_push"  = "Push your first Docker image to ECR: ${aws_ecr_repository.backend.repository_url}"
    "5_phase8_oidc"       = "When ready for OIDC: delete GitHub static key secrets, update workflow to use role-to-assume: ${aws_iam_role.github_actions.arn}"
  }
}

output "cost_summary" {
  description = "Monthly cost estimate for this environment"
  value = {
    environment            = var.environment
    estimated_monthly_cost = var.environment == "staging" ? "~$75/month" : "~$210/month"
    breakdown = var.environment == "staging" ? {
      nat_gateway      = "$32.85"
      data_processing  = "$2.25"
      rds              = "$15.00"
      ecs_fargate      = "$9.12"
      alb              = "$18.75"
      s3_bucket        = "~$1.00"
      cloudfront       = "$0 (disabled in staging)"
      cloudwatch_logs  = "$2.00"
      container_insights = "$2.00"
      data_transfer    = "$5.00"
    } : {
      nat_gateways       = "$65.70"
      data_processing    = "$4.50"
      aurora             = "$60.00"
      ecs_fargate        = "$36.50"
      alb                = "$18.75"
      s3_bucket          = "~$2.00"
      cloudfront         = "~$10.00"
      waf                = "~$5.00"
      cloudwatch_logs    = "$5.00"
      container_insights = "$3.00"
      data_transfer      = "$10.00"
    }
  }
}

