# ================================================================
# terraform/waf.tf
# AWS WAF — Web Application Firewall
# ================================================================
# What is WAF?
#   A firewall that inspects every HTTP request BEFORE it reaches
#   your application. It blocks:
#   - SQL injection: "'; DROP TABLE users; --"
#   - XSS attacks: "<script>steal(cookies)</script>"
#   - Bot traffic: scrapers, credential stuffers
#   - Rate limit violations: too many requests from one IP
#   - Known bad IPs: AWS maintains a list of known attackers
#
# Cost: ~$5/month base + $0.60 per million requests
# For most apps: <$15/month total
#
# NOTE: WAF for CloudFront MUST be created in us-east-1 region
#   (even if your app is in another region)
#   scope = "CLOUDFRONT" requires us-east-1
# ================================================================

# ── WAF Web ACL ──────────────────────────────────────────────────
# An ACL (Access Control List) is a list of rules.
# Requests are checked against each rule in priority order.
# Default action = ALLOW (allowlist approach — block specific bad things)
resource "aws_wafv2_web_acl" "main" {
  count = var.enable_waf ? 1 : 0

  name        = "${var.project_name}-${var.environment}-waf"
  description = "WAF for ${var.project_name} ${var.environment} CloudFront distribution"
  scope       = "CLOUDFRONT"  # Must be CLOUDFRONT for CloudFront distributions

  # Default: allow all requests unless a rule blocks them
  default_action {
    allow {}
  }

  # ── Rule 1: AWS Common Rule Set ──────────────────────────────
  # AWS maintains this rule set and updates it automatically.
  # Blocks the OWASP Top 10 most common web attacks:
  #   - SQL injection
  #   - Cross-site scripting (XSS)
  #   - Remote file inclusion
  #   - Server-side request forgery (SSRF)
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 10

    override_action {
      none {}  # Use the rule set's built-in actions (block)
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-${var.environment}-CommonRules"
      sampled_requests_enabled   = true
    }
  }

  # ── Rule 2: SQL Injection Protection ─────────────────────────
  # Specifically targets SQL injection attempts in query strings,
  # request bodies, and headers
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 20

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-${var.environment}-SQLiRules"
      sampled_requests_enabled   = true
    }
  }

  # ── Rule 3: Known Bad Inputs ─────────────────────────────────
  # Blocks requests that match patterns known to be malicious:
  # Log4Shell exploit, Spring Boot RCE, etc.
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 30

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-${var.environment}-KnownBadInputs"
      sampled_requests_enabled   = true
    }
  }

  # ── Rule 4: Rate Limiting ────────────────────────────────────
  # Block any single IP that makes more than 2000 requests in 5 minutes
  # This prevents:
  #   - Brute force login attempts
  #   - Credential stuffing
  #   - DDoS attacks from single IPs
  #   - API abuse
  rule {
    name     = "RateLimitPerIP"
    priority = 40

    action {
      block {}  # Block the IP when threshold is exceeded
    }

    statement {
      rate_based_statement {
        limit              = 2000           # Max 2000 requests per 5-minute window
        aggregate_key_type = "IP"           # Count per IP address
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-${var.environment}-RateLimit"
      sampled_requests_enabled   = true
    }
  }

  # ── Rule 5: Stricter rate limit for login endpoint ──────────
  # The login endpoint should have a stricter limit:
  # Max 20 login attempts per IP per 5 minutes
  # This significantly slows down brute force attacks
  rule {
    name     = "RateLimitLoginEndpoint"
    priority = 50

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 20
        aggregate_key_type = "IP"

        scope_down_statement {
          byte_match_statement {
            search_string = "/api/auth/login"
            field_to_match {
              uri_path {}
            }
            text_transformation {
              priority = 0
              type     = "LOWERCASE"
            }
            positional_constraint = "STARTS_WITH"
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-${var.environment}-LoginRateLimit"
      sampled_requests_enabled   = true
    }
  }

  # ── WAF Metrics ──────────────────────────────────────────────
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-${var.environment}-waf"
    sampled_requests_enabled   = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-waf"
  }
}

# ── WAF Logging ──────────────────────────────────────────────────
# Log all WAF decisions (what was blocked and why) to CloudWatch
resource "aws_cloudwatch_log_group" "waf" {
  count = var.enable_waf ? 1 : 0

  name              = "aws-waf-logs-${var.project_name}-${var.environment}"
  retention_in_days = 30

  tags = {
    Name = "${var.project_name}-${var.environment}-waf-logs"
  }
}

resource "aws_wafv2_web_acl_logging_configuration" "main" {
  count = var.enable_waf ? 1 : 0

  log_destination_configs = [aws_cloudwatch_log_group.waf[0].arn]
  resource_arn            = aws_wafv2_web_acl.main[0].arn
}

# ── CloudWatch Alarm: WAF Blocking too many requests ─────────────
# Alert if WAF blocks > 1000 requests per minute (possible attack)
resource "aws_cloudwatch_metric_alarm" "waf_blocked_requests" {
  count = var.enable_waf ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-waf-high-blocks"
  alarm_description   = "WAF blocking more than 1000 requests per minute — possible attack"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "BlockedRequests"
  namespace           = "AWS/WAFV2"
  period              = "60"
  statistic           = "Sum"
  threshold           = "1000"

  alarm_actions     = [aws_sns_topic.alerts.arn]
  treat_missing_data = "notBreaching"

  dimensions = {
    WebACL = "${var.project_name}-${var.environment}-waf"
    Rule   = "ALL"
    Region = "us-east-1"
  }
}
