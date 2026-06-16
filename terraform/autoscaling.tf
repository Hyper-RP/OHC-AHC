# ================================================================
# terraform/autoscaling.tf
# ECS Auto Scaling — Automatically adjust container count with traffic
# ================================================================
# What is Auto Scaling?
#   Normally you have a fixed number of ECS tasks (e.g., 2).
#   With Auto Scaling, AWS automatically adds more tasks when traffic
#   spikes and removes them when traffic drops.
#
# Example:
#   Normal traffic: 2 tasks running
#   Black Friday spike: 8 tasks auto-started
#   After spike: scales back to 2 tasks
#   You only pay for the tasks that ran!
#
# Scaling triggers (this file):
#   Scale UP:   CPU  > 70% for 2 minutes  → add more tasks
#   Scale UP:   RAM  > 80% for 2 minutes  → add more tasks
#   Scale DOWN: CPU  < 40% for 5 minutes  → remove tasks
#   Scale DOWN: RAM  < 40% for 5 minutes  → remove tasks
# ================================================================

# ── Register ECS Service as a Scalable Target ─────────────────────
# This tells AWS "this ECS service can be scaled between min and max tasks"
resource "aws_appautoscaling_target" "ecs" {
  service_namespace  = "ecs"
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"

  # Staging:    min=0 allows scheduled scale-to-zero at night
  # Production: min=2 ensures high availability at all times
  min_capacity = var.environment == "production" ? 2 : 0
  max_capacity = var.environment == "production" ? 10 : 3
}

# ── Scale based on CPU utilization ────────────────────────────────
# Target Tracking Policy: AWS automatically adds/removes tasks to keep
# CPU around the target value (like a thermostat)
resource "aws_appautoscaling_policy" "cpu" {
  name               = "${var.project_name}-${var.environment}-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension

  target_tracking_scaling_policy_configuration {
    # Keep CPU around 70%
    # AWS will add tasks if CPU goes above 70% and remove if it stays below
    target_value = 70.0

    # After scaling UP, wait 60 seconds before scaling again
    # (New tasks need time to start and receive traffic)
    scale_out_cooldown = 60

    # After scaling DOWN, wait 300 seconds before scaling down again
    # (Be conservative when removing tasks — keep buffer for sudden spikes)
    scale_in_cooldown = 300

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }

  depends_on = [aws_appautoscaling_target.ecs]
}

# ── Scale based on Memory utilization ─────────────────────────────
resource "aws_appautoscaling_policy" "memory" {
  name               = "${var.project_name}-${var.environment}-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension

  target_tracking_scaling_policy_configuration {
    target_value       = 80.0  # Keep memory below 80%
    scale_out_cooldown = 60
    scale_in_cooldown  = 300

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
  }

  depends_on = [aws_appautoscaling_target.ecs]
}

# ── Scale based on ALB Request Count ─────────────────────────────
# Scale based on how many requests per task are happening
# 1000 requests per task per minute = add more tasks
resource "aws_appautoscaling_policy" "requests" {
  name               = "${var.project_name}-${var.environment}-request-scaling"
  policy_type        = "TargetTrackingScaling"
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension

  target_tracking_scaling_policy_configuration {
    target_value       = 1000  # Target: 1000 requests per task per minute
    scale_out_cooldown = 60
    scale_in_cooldown  = 300

    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      # This links to your specific target group
      resource_label = "${aws_lb.main.arn_suffix}/${aws_lb_target_group.main.arn_suffix}"
    }
  }

  depends_on = [aws_appautoscaling_target.ecs]
}

# ================================================================
# Scheduled Scale-to-Zero — Staging Only
# Saves ~60-70% of ECS cost by running tasks only during work hours
#
# Schedule (IST = UTC+5:30):
#   Scale UP:   9:00 AM IST = 03:30 UTC  (Mon-Fri only)
#   Scale DOWN: 8:00 PM IST = 14:30 UTC  (every day, covers weekends)
#
# To adjust timezone, change the UTC hours:
#   New UTC hour = Desired IST hour - 5:30
#   Example: 10 AM IST = 04:30 UTC → cron(30 4 ? * MON-FRI *)
# ================================================================

resource "aws_appautoscaling_scheduled_action" "scale_up_morning" {
  count = var.environment == "staging" ? 1 : 0

  name               = "${var.project_name}-${var.environment}-scale-up-morning"
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension

  # 9:00 AM IST (03:30 UTC) Monday through Friday
  schedule = "cron(30 3 ? * MON-FRI *)"

  scalable_target_action {
    min_capacity = 1
    max_capacity = 3
  }

  depends_on = [aws_appautoscaling_target.ecs]
}

resource "aws_appautoscaling_scheduled_action" "scale_down_evening" {
  count = var.environment == "staging" ? 1 : 0

  name               = "${var.project_name}-${var.environment}-scale-down-evening"
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension

  # 8:00 PM IST (14:30 UTC) every day
  # Friday scale-down keeps tasks at 0 through Saturday and Sunday
  # until Monday morning scale-up fires
  schedule = "cron(30 14 ? * * *)"

  scalable_target_action {
    min_capacity = 0
    max_capacity = 0
  }

  depends_on = [aws_appautoscaling_target.ecs]
}
