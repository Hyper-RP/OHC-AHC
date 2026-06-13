# ================================================================
# terraform/monitoring.tf
# CloudWatch Alarms, SNS Notifications, and Dashboard
# ================================================================
# What is CloudWatch?
#   AWS's built-in monitoring service. It collects metrics from every
#   AWS service (CPU, memory, request counts, error rates) and lets
#   you set up alarms.
#
# What is SNS?
#   Simple Notification Service. CloudWatch sends alarms TO SNS,
#   and SNS emails YOU. SNS can also send to Slack, PagerDuty, etc.
#
# Alarms in this file:
#   1. ECS CPU > 85%        → App is overloaded
#   2. ECS Memory > 90%     → App is running out of memory
#   3. ALB 5xx errors > 10  → App is returning server errors
#   4. ALB response time > 2s → App is very slow
#   5. RDS CPU > 80%        → Database is struggling
#   6. RDS connections high → Too many DB connections
#   7. ECS task count = 0   → App is completely down!
# ================================================================

# ── SNS Topic — the notification hub ────────────────────────────
# Think of SNS as a broadcast system:
#   CloudWatch alarm fires → sends to SNS topic → SNS emails you
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-${var.environment}-alerts"

  tags = {
    Name = "${var.project_name}-${var.environment}-alerts-topic"
  }
}

# Subscribe your email to receive alarm notifications
resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
  # NOTE: After terraform apply, you'll receive a confirmation email.
  # You MUST click the confirmation link or you won't receive any alerts!
}

# ── Alarm 1: ECS CPU High ────────────────────────────────────────
# Triggers when CPU stays above 85% for 4 minutes (2 checks × 2 min)
# What it means: Your app is getting hammered. Add more tasks or optimize.
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "${var.project_name}-${var.environment}-ecs-cpu-high"
  alarm_description   = "ECS CPU above 85% for 4 minutes — app may be overloaded"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"         # 2 consecutive checks must breach threshold
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "120"       # Check every 2 minutes
  statistic           = "Average"
  threshold           = "85"

  alarm_actions = [aws_sns_topic.alerts.arn]   # Alert when threshold breached
  ok_actions    = [aws_sns_topic.alerts.arn]   # Alert when it recovers too

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.app.name
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-cpu-alarm"
  }
}

# ── Alarm 2: ECS Memory High ─────────────────────────────────────
resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  alarm_name          = "${var.project_name}-${var.environment}-ecs-memory-high"
  alarm_description   = "ECS memory above 90% — tasks may be killed by OOM killer"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "120"
  statistic           = "Average"
  threshold           = "90"

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.app.name
  }
}

# ── Alarm 3: ALB 5xx Errors ──────────────────────────────────────
# 5xx = server errors (500, 502, 503, 504)
# These are YOUR app's errors (not user errors like 404)
resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "${var.project_name}-${var.environment}-5xx-errors"
  alarm_description   = "More than 10 server errors per minute — app is crashing"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "60"       # Check every 1 minute
  statistic           = "Sum"
  threshold           = "10"       # Alert if > 10 errors per minute

  alarm_actions     = [aws_sns_topic.alerts.arn]
  treat_missing_data = "notBreaching"  # No data = no alarm (normal at low traffic)

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }
}

# ── Alarm 4: ALB Response Time ───────────────────────────────────
# p95 = 95th percentile: 95% of requests complete within this time
# A p95 of 2 seconds means 1 in 20 users waits > 2 seconds
resource "aws_cloudwatch_metric_alarm" "alb_response_time" {
  alarm_name          = "${var.project_name}-${var.environment}-slow-responses"
  alarm_description   = "95th percentile response time above 2 seconds — app is slow"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "120"
  extended_statistic  = "p95"      # Use percentile (more accurate than average)
  threshold           = "2"        # Alert if 95% of users wait > 2 seconds

  alarm_actions     = [aws_sns_topic.alerts.arn]
  treat_missing_data = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
    TargetGroup  = aws_lb_target_group.main.arn_suffix
  }
}

# ── Alarm 5: RDS CPU High ────────────────────────────────────────
resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "${var.project_name}-${var.environment}-rds-cpu-high"
  alarm_description   = "RDS CPU above 80% — database may be struggling"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"      # Check every 5 minutes (RDS metrics are slower)
  statistic           = "Average"
  threshold           = "80"

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  dimensions = {
    # Use the correct identifier based on environment
    DBInstanceIdentifier = var.environment == "staging" ? aws_db_instance.main[0].id : aws_rds_cluster.main[0].id
  }
}

# ── Alarm 6: RDS Free Storage Low ────────────────────────────────
# Alert when database disk is getting full (< 2GB free)
resource "aws_cloudwatch_metric_alarm" "rds_low_storage" {
  alarm_name          = "${var.project_name}-${var.environment}-rds-low-storage"
  alarm_description   = "RDS free storage below 2GB — database disk almost full!"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "2000000000"  # 2 GB in bytes

  alarm_actions = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = var.environment == "staging" ? aws_db_instance.main[0].id : aws_rds_cluster.main[0].id
  }
}

# ── Alarm 7: ECS Running Tasks = 0 ──────────────────────────────
# This is the most critical alarm — your app is completely down!
resource "aws_cloudwatch_metric_alarm" "ecs_no_tasks" {
  alarm_name          = "${var.project_name}-${var.environment}-no-running-tasks"
  alarm_description   = "CRITICAL: No ECS tasks running - APPLICATION IS DOWN"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "RunningTaskCount"
  namespace           = "ECS/ContainerInsights"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"

  alarm_actions     = [aws_sns_topic.alerts.arn]
  treat_missing_data = "breaching"  # No data = alarm (maybe ECS is down entirely)

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.app.name
  }
}

# ── CloudWatch Dashboard ─────────────────────────────────────────
# A single page in the CloudWatch console showing all key metrics
# Go to: AWS Console → CloudWatch → Dashboards → ohc-ahc-production
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "text"
        x      = 0
        y      = 0
        width  = 24
        height = 1
        properties = {
          markdown = "# OHC-AHC ${var.environment} Dashboard | [ECS Logs](/cloudwatch/home#logsV2:log-groups/log-group//ecs/${var.project_name}-${var.environment})"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 1
        width  = 8
        height = 6
        properties = {
          region  = var.aws_region
          title   = "ECS CPU Utilization (%)"
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/ECS", "CPUUtilization",
              "ClusterName", "${var.project_name}-${var.environment}-cluster",
              "ServiceName", "${var.project_name}-${var.environment}-service",
              { "stat" : "Average", "period" : 60 }]
          ]
          annotations = {
            horizontal = [{ value = 85, label = "ALERT threshold", color = "#ff0000" }]
          }
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 1
        width  = 8
        height = 6
        properties = {
          region  = var.aws_region
          title   = "ECS Memory Utilization (%)"
          view    = "timeSeries"
          metrics = [
            ["AWS/ECS", "MemoryUtilization",
              "ClusterName", "${var.project_name}-${var.environment}-cluster",
              "ServiceName", "${var.project_name}-${var.environment}-service",
              { "stat" : "Average", "period" : 60 }]
          ]
          annotations = {
            horizontal = [{ value = 90, label = "ALERT threshold", color = "#ff0000" }]
          }
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 1
        width  = 8
        height = 6
        properties = {
          region  = var.aws_region
          title   = "ALB Request Count (per min)"
          view    = "timeSeries"
          metrics = [
            ["AWS/ApplicationELB", "RequestCount",
              "LoadBalancer", "${var.project_name}-${var.environment}-alb",
              { "stat" : "Sum", "period" : 60 }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 7
        width  = 12
        height = 6
        properties = {
          region  = var.aws_region
          title   = "HTTP Error Rates (5xx = server errors)"
          view    = "timeSeries"
          metrics = [
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count",
              "LoadBalancer", "${var.project_name}-${var.environment}-alb",
              { "stat" : "Sum", "period" : 60, "color" : "#ff0000", "label" : "5xx Errors" }],
            ["AWS/ApplicationELB", "HTTPCode_Target_4XX_Count",
              "LoadBalancer", "${var.project_name}-${var.environment}-alb",
              { "stat" : "Sum", "period" : 60, "color" : "#ff9900", "label" : "4xx Errors" }]
          ]
          annotations = {
            horizontal = [{ value = 10, label = "5xx ALERT", color = "#ff0000" }]
          }
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 7
        width  = 12
        height = 6
        properties = {
          region  = var.aws_region
          title   = "Response Time p50 / p95 / p99 (seconds)"
          view    = "timeSeries"
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime",
              "LoadBalancer", "${var.project_name}-${var.environment}-alb",
              { "stat" : "p50", "period" : 60, "label" : "p50 (median)" }],
            ["AWS/ApplicationELB", "TargetResponseTime",
              "LoadBalancer", "${var.project_name}-${var.environment}-alb",
              { "stat" : "p95", "period" : 60, "label" : "p95", "color" : "#ff9900" }],
            ["AWS/ApplicationELB", "TargetResponseTime",
              "LoadBalancer", "${var.project_name}-${var.environment}-alb",
              { "stat" : "p99", "period" : 60, "label" : "p99", "color" : "#ff0000" }]
          ]
          annotations = {
            horizontal = [{ value = 2, label = "2s ALERT", color = "#ff0000" }]
          }
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 13
        width  = 12
        height = 6
        properties = {
          region  = var.aws_region
          title   = "RDS CPU & Connections"
          view    = "timeSeries"
          metrics = [
            ["AWS/RDS", "CPUUtilization",
              "DBInstanceIdentifier", "${var.project_name}-${var.environment}-db",
              { "stat" : "Average", "period" : 60, "label" : "CPU %" }],
            ["AWS/RDS", "DatabaseConnections",
              "DBInstanceIdentifier", "${var.project_name}-${var.environment}-db",
              { "stat" : "Average", "period" : 60, "yAxis" : "right", "label" : "Connections" }]
          ]
        }
      },
      {
        type   = "alarm"
        x      = 12
        y      = 13
        width  = 12
        height = 6
        properties = {
          title  = "🚨 Active Alarms"
          alarms = [
            aws_cloudwatch_metric_alarm.ecs_cpu_high.arn,
            aws_cloudwatch_metric_alarm.ecs_memory_high.arn,
            aws_cloudwatch_metric_alarm.alb_5xx_errors.arn,
            aws_cloudwatch_metric_alarm.alb_response_time.arn,
            aws_cloudwatch_metric_alarm.rds_cpu_high.arn,
            aws_cloudwatch_metric_alarm.ecs_no_tasks.arn,
          ]
        }
      }
    ]
  })
}
