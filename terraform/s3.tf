# ================================================================
# terraform/s3.tf
# Amazon S3 — File Storage for Static Assets and Media Uploads
# ================================================================
# What is S3?
#   S3 (Simple Storage Service) is AWS's infinite file storage.
#   Files are stored as "objects" in "buckets". Your Django app
#   already has django-storages + boto3 installed — it's ready!
#
# What is stored here?
#   /static/*  → Django static files (CSS, JS, admin panel assets)
#   /media/*   → User-uploaded files (profile pictures, documents)
#   /react/*   → Your built React app (JS bundles, index.html)
#
# How does it work?
#   1. Django collectstatic uploads files to S3
#   2. CloudFront CDN serves them globally from edge locations
#   3. Users download files from the nearest edge (fast!)
# ================================================================

resource "aws_s3_bucket" "static" {
  bucket = "${var.project_name}-${var.environment}-static"

  tags = {
    Name        = "${var.project_name}-${var.environment}-static"
    Environment = var.environment
    Purpose     = "Static files and media uploads"
  }
}

# ── Block ALL public access ────────────────────────────────────────
# Files are NOT served directly from S3.
# CloudFront uses an OAC (Origin Access Control) to access them.
# End users can ONLY access files through CloudFront.
resource "aws_s3_bucket_public_access_block" "static" {
  bucket = aws_s3_bucket.static.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ── Enable versioning ──────────────────────────────────────────────
# Versioning keeps old copies of files even after they're overwritten.
# Benefit: You can recover accidentally deleted/overwritten files.
resource "aws_s3_bucket_versioning" "static" {
  bucket = aws_s3_bucket.static.id

  versioning_configuration {
    status = var.environment == "production" ? "Enabled" : "Suspended"
    # Disabled for staging to avoid extra storage costs
  }
}

# ── Encrypt all files at rest ──────────────────────────────────────
# All files are automatically encrypted using AES-256 before storage.
# This is especially important for healthcare data (HIPAA).
resource "aws_s3_bucket_server_side_encryption_configuration" "static" {
  bucket = aws_s3_bucket.static.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true  # Reduces KMS API calls by 99% if you switch to KMS later
  }
}

# ── CORS Configuration ────────────────────────────────────────────
# CORS (Cross-Origin Resource Sharing) allows your frontend
# at ohc-ahc.com to upload files directly to S3 without going
# through your Django server. This is faster for large files.
resource "aws_s3_bucket_cors_configuration" "static" {
  bucket = aws_s3_bucket.static.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "HEAD"]
    allowed_origins = [
      "https://ohc-ahc.com",
      "https://www.ohc-ahc.com",
      "https://api.ohc-ahc.com",
      # Allow staging domain too
      "https://staging.ohc-ahc.com",
    ]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

# ── Lifecycle Rules — Automatic File Cleanup ───────────────────────
# Automatically move/delete old files to save storage costs
resource "aws_s3_bucket_lifecycle_configuration" "static" {
  bucket = aws_s3_bucket.static.id

  rule {
    id     = "delete-old-versions"
    status = "Enabled"

    filter {
      prefix = ""  # Apply to all objects
    }

    # Delete old versions of files after 30 days (keeps storage lean)
    noncurrent_version_expiration {
      noncurrent_days = 30
    }

    # Delete incomplete multipart uploads after 7 days
    # (These happen when large file uploads fail partway through)
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }

  rule {
    id     = "move-old-logs-to-glacier"
    status = var.environment == "production" ? "Enabled" : "Disabled"

    filter {
      prefix = "logs/"
    }

    # Move log files to Glacier Instant Retrieval after 90 days
    # Glacier costs ~$0.004/GB vs S3 Standard's $0.023/GB
    transition {
      days          = 90
      storage_class = "GLACIER_IR"
    }

    # Delete log files after 365 days
    expiration {
      days = 365
    }
  }
}

# ── CloudFront Origin Access Control ─────────────────────────────
# OAC allows CloudFront to access private S3 objects.
# Without OAC, CloudFront couldn't read from a private bucket.
resource "aws_cloudfront_origin_access_control" "s3" {
  count = var.environment == "production" ? 1 : 0

  name                              = "${var.project_name}-${var.environment}-oac"
  description                       = "OAC for ${var.project_name} S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ── S3 Bucket Policy — Allow CloudFront OAC ──────────────────────
# This policy says "CloudFront (using OAC) is allowed to read from this bucket"
resource "aws_s3_bucket_policy" "static" {
  count  = var.environment == "production" ? 1 : 0
  bucket = aws_s3_bucket.static.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontAccess"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.static.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.main[0].arn
          }
        }
      }
    ]
  })

  depends_on = [aws_cloudfront_distribution.main]
}
