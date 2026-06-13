# Application Load Balancer
# Required for both staging and production (HTTPS termination)

locals {
  # Enable SSL/TLS only if a valid, non-placeholder ACM certificate ARN is provided
  is_ssl_enabled = var.acm_certificate_arn != "" && var.acm_certificate_arn != null && !startswith(var.acm_certificate_arn, "arn:aws:acm:us-east-1:YOUR_")
}

resource "aws_lb" "main" {
  name               = "${var.project_name}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = var.environment == "production"

  tags = {
    Name = "${var.project_name}-${var.environment}-alb"
  }
}

resource "aws_lb_target_group" "main" {
  name        = "${var.project_name}-${var.environment}-tg"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    path                = "/health/"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-tg"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = local.is_ssl_enabled ? "redirect" : "forward"
    target_group_arn = local.is_ssl_enabled ? null : aws_lb_target_group.main.arn

    dynamic "redirect" {
      for_each = local.is_ssl_enabled ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
  }
}

resource "aws_lb_listener" "https" {
  count             = local.is_ssl_enabled ? 1 : 0
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.acm_certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# ================================================================
# CloudFront CDN (Production only — disabled in staging to save money)
# ================================================================
# What is CloudFront?
#   CloudFront has ~400 "edge locations" worldwide (servers near users).
#   When a user in India requests your app, they get it from an edge
#   in Mumbai, not from your us-east-1 server. Much faster!
#
# CRITICAL DESIGN: Two separate cache behaviors
#   /api/* and /admin/* → NO CACHE (forward everything to Django)
#   /static/*           → CACHE for 1 year (JS/CSS never changes between deploys)
#   /* (default)        → SHORT CACHE for HTML (React SPA shell)
#
# Previous bug: ALL requests were cached with the same policy.
# This broke API calls (POST/PUT/DELETE were being cached!)
# ================================================================

resource "aws_cloudfront_distribution" "main" {
  count = var.environment == "production" ? 1 : 0

  # ── Origin: Your Application Load Balancer ────────────────────
  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "${var.project_name}-alb-origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"  # Always use HTTPS to ALB
      origin_ssl_protocols   = ["TLSv1.2"]
    }

    # Add custom headers so Django can identify CloudFront requests
    custom_header {
      name  = "X-CloudFront-Secret"
      value = var.cloudfront_secret_header
    }
  }

  enabled         = true
  is_ipv6_enabled = true
  http_version    = "http2and3"  # Enable HTTP/3 for faster connections
  price_class     = "PriceClass_100"  # Use only US/EU edge locations (cheapest)

  # ── Ordered Behavior 1: API routes — NEVER cache ──────────────
  # /api/* requests go straight through to Django — zero caching
  # ALL HTTP methods allowed (GET, POST, PUT, DELETE, etc.)
  # ALL headers forwarded (Authorization, Content-Type, etc.)
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "${var.project_name}-alb-origin"

    forwarded_values {
      query_string = true  # Forward all query params to Django
      headers      = ["Authorization", "Origin", "Accept", "Content-Type",
                      "X-Requested-With", "X-CSRFToken"]
      cookies {
        forward = "all"  # Forward cookies for session auth
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0  # NO CACHING
    max_ttl                = 0  # NO CACHING
    compress               = true
  }

  # ── Ordered Behavior 2: Django Admin — NEVER cache ────────────
  ordered_cache_behavior {
    path_pattern     = "/admin/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "${var.project_name}-alb-origin"

    forwarded_values {
      query_string = true
      headers      = ["*"]  # Forward all headers for admin
      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
    compress               = true
  }

  # ── Ordered Behavior 3: Static files — CACHE aggressively ─────
  # Django collectstatic and React build files never change their content
  # (Vite adds content hashes to filenames: main.a1b2c3.js)
  # So we can safely cache for 1 year — cache invalidated on each deploy
  ordered_cache_behavior {
    path_pattern     = "/static/*"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "${var.project_name}-alb-origin"

    forwarded_values {
      query_string = false  # Ignore query params for static files
      cookies {
        forward = "none"   # No cookies needed for static files
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400     # 1 day default cache
    max_ttl                = 31536000  # 1 year maximum cache
    compress               = true
  }

  # ── Ordered Behavior 4: Health check — NEVER cache ────────────
  ordered_cache_behavior {
    path_pattern     = "/health/*"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "${var.project_name}-alb-origin"

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
    compress               = false
  }

  # ── Default Behavior: React SPA — SHORT cache ─────────────────
  # The React index.html — cache for a short time
  # Short cache (5 min) so new deploys propagate quickly
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "${var.project_name}-alb-origin"

    forwarded_values {
      query_string = true
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 300   # 5 minutes — balances freshness vs performance
    max_ttl                = 3600  # 1 hour maximum
    compress               = true
  }

  # ── Custom error pages — SPA routing ─────────────────────────
  # React Router handles routing — return index.html for all 404s
  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  # ── Geo restrictions ──────────────────────────────────────────
  restrictions {
    geo_restriction {
      restriction_type = "none"  # No geo-blocking (change if needed for compliance)
    }
  }

  # ── SSL Certificate ───────────────────────────────────────────
  viewer_certificate {
    acm_certificate_arn      = var.acm_certificate_arn
    ssl_support_method       = "sni-only"          # Modern SNI — no dedicated IPs needed
    minimum_protocol_version = "TLSv1.2_2021"      # TLS 1.2 minimum (1.0/1.1 are insecure)
  }

  # ── Access Logging ─────────────────────────────────────────────
  # Logs every CloudFront request to S3 for analysis
  logging_config {
    include_cookies = false
    bucket          = "${var.project_name}-${var.environment}-static.s3.amazonaws.com"
    prefix          = "cloudfront-logs/"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-cloudfront"
  }

  depends_on = [aws_s3_bucket.static]
}
