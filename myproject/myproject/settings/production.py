"""
Production settings for myproject.

This file contains production-specific configuration for AWS deployment.
It uses AWS Secrets Manager for sensitive credentials and S3 for static/media files.

Usage: Set DJANGO_SETTINGS_MODULE=myproject.settings.production
"""

from ..settings import *
import os
import boto3
import json

# =============================================================================
# PRODUCTION SECURITY SETTINGS
# =============================================================================

# SECURITY WARNING: keep the secret key used in production secret!
# Retrieved from AWS Secrets Manager
def get_secret():
    """
    Retrieve secrets from AWS Secrets Manager.

    Expected secret format:
    {
        "DB_PASSWORD": "your_password",
        "SECRET_KEY": "your_django_secret_key"
    }
    """
    try:
        client = boto3.client('secretsmanager', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
        response = client.get_secret_value(SecretId='ohc-ahc/production')
        return json.loads(response['SecretString'])
    except Exception as e:
        # Fallback to environment variables if Secrets Manager fails
        print(f"Warning: Could not retrieve from Secrets Manager: {e}")
        return {
            'DB_PASSWORD': os.environ.get('DB_PASSWORD', ''),
            'SECRET_KEY': os.environ.get('SECRET_KEY', '')
        }

# Get secrets from AWS Secrets Manager
secrets = get_secret()

# Override the insecure secret key from base settings
SECRET_KEY = secrets.get('SECRET_KEY', os.environ.get('SECRET_KEY', 'change-me-in-production'))

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# =============================================================================
# ALLOWED HOSTS
# =============================================================================

# Add your production domains here
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost').split(',')

# =============================================================================
# DATABASE SETTINGS (AWS RDS PostgreSQL)
# =============================================================================

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'ohc_db'),
        'USER': os.environ.get('DB_USER', 'ohc_user'),
        'PASSWORD': secrets.get('DB_PASSWORD', os.environ.get('DB_PASSWORD', '')),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
        'CONN_MAX_AGE': 60,  # Enable connection pooling
        'OPTIONS': {
            'sslmode': 'require',  # Require SSL for production
        },
    }
}

# =============================================================================
# STATIC & MEDIA FILES (AWS S3)
# =============================================================================

# Static files (CSS, JavaScript, Images)
# Use S3 with CloudFront for production
STATIC_URL = os.environ.get('STATIC_URL', 'https://static.ohc-ahc.com/')
STATIC_ROOT = '/tmp/static'  # Temporary location during collectstatic
STATICFILES_DIRS = [BASE_DIR / 'static']

# Media files (user uploads)
MEDIA_URL = os.environ.get('MEDIA_URL', 'https://media.ohc-ahc.com/')
MEDIA_ROOT = '/tmp/media'

# AWS S3 Configuration
AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME', 'ohc-ahc-static-files')
AWS_S3_REGION_NAME = os.environ.get('AWS_REGION', 'us-east-1')
AWS_S3_CUSTOM_DOMAIN = os.environ.get('AWS_S3_CUSTOM_DOMAIN', 'static.ohc-ahc.com')
AWS_S3_OBJECT_PARAMETERS = {
    'CacheControl': 'max-age=86400',
}
AWS_S3_FILE_OVERWRITE = False
AWS_DEFAULT_ACL = 'public-read'

# Use django-storages for S3 backend
# This requires 'django-storages' to be installed
STORAGES = {
    'staticfiles': {
        'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage',
    },
    'default': {
        'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage',
    },
}

# =============================================================================
# CORS SETTINGS
# =============================================================================

# Update CORS for production domains
CORS_ALLOWED_ORIGINS = [
    "https://ohc-ahc.com",
    "https://www.ohc-ahc.com",
    "https://api.ohc-ahc.com",
]

# Disable CORS_ALLOW_ALL_ORIGINS in production
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True

# =============================================================================
# SECURITY SETTINGS
# =============================================================================

# HTTPS/SSL Settings
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# HSTS Settings
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Other Security Settings
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'

# =============================================================================
# LOGGING
# =============================================================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'cloudwatch': {
            'class': 'watchtower.CloudWatchLogHandler',
            'formatter': 'verbose',
            'boto3_client': boto3.client('logs', region_name=os.environ.get('AWS_REGION', 'us-east-1')),
            'log_group': '/ecs/ohc-ahc-app',
            'stream_name': '{function_name}',
        },
    },
    'root': {
        'handlers': ['console', 'cloudwatch'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'cloudwatch'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console', 'cloudwatch'],
            'level': 'ERROR',
            'propagate': False,
        },
    },
}

# =============================================================================
# EMAIL SETTINGS (Optional - AWS SES)
# =============================================================================

# Uncomment and configure if using AWS SES for emails
# EMAIL_BACKEND = 'django_ses.SESBackend'
# DEFAULT_FROM_EMAIL = 'noreply@ohc-ahc.com'
# AWS_SES_REGION_NAME = os.environ.get('AWS_REGION', 'us-east-1')
# AWS_SES_REGION_ENDPOINT = f'email.{os.environ.get("AWS_REGION", "us-east-1")}.amazonaws.com'

# =============================================================================
# PERFORMANCE SETTINGS
# =============================================================================

# Enable caching (can use ElastiCache Redis if needed)
# CACHES = {
#     'default': {
#         'BACKEND': 'django.core.cache.backends.redis.RedisCache',
#         'LOCATION': os.environ.get('REDIS_URL', 'redis://localhost:6379/0'),
#         'OPTIONS': {
#             'CLIENT_CLASS': 'django_redis.client.DefaultClient',
#         },
#         'KEY_PREFIX': 'ohc-ahc',
#         'TIMEOUT': 300,
#     }
# }

# =============================================================================
# ENVIRONMENT-SOUPIC OVERRIDES
# =============================================================================

# Allow environment variables to override any setting
def env_var(key, default=None, cast=None):
    """Get environment variable with optional type casting."""
    value = os.environ.get(key, default)
    if cast and value:
        if cast == bool:
            return value.lower() in ('true', '1', 'yes', 'on')
        return cast(value)
    return value

# Allow dynamic overrides from environment
DEBUG = env_var('DEBUG', DEBUG, bool)
ALLOWED_HOSTS = env_var('ALLOWED_HOSTS', ','.join(ALLOWED_HOSTS)).split(',')
