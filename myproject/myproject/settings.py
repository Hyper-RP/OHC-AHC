"""
Django settings for myproject project.
Production-ready configuration that reads all secrets from environment variables.

In development:  Uses SQLite, reads from local env or .env file
In production:   Uses PostgreSQL, reads from AWS Secrets Manager via ECS task definition
"""
from pathlib import Path
import os
# ─────────────────────────────────────────────────────────────────
# Base Directory
# ─────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent

# ─────────────────────────────────────────────────────────────────
# Environment Detection
# DJANGO_ENV is set to "production" in the ECS task definition.
# In local development, it's not set, so it defaults to "development".
# ─────────────────────────────────────────────────────────────────
IS_PRODUCTION = os.getenv('DJANGO_ENV', 'development') == 'production'

# ─────────────────────────────────────────────────────────────────
# Secret Key
# Production: ECS injects this from AWS Secrets Manager
# Development: Uses a local insecure key (NEVER use the dev key in prod!)
# ─────────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv(
    'SECRET_KEY',
    'django-insecure-local-dev-only-85lx=_-#m&iqc@m1qu_+qk=u#wy4kay059^h9+'
)
if IS_PRODUCTION and SECRET_KEY.startswith('django-insecure'):
    raise RuntimeError("FATAL: Production is running with an insecure SECRET_KEY!")

# ─────────────────────────────────────────────────────────────────
# Debug Mode
# NEVER True in production — exposes stack traces and secrets!
# ─────────────────────────────────────────────────────────────────
DEBUG = os.getenv('DEBUG', 'True' if not IS_PRODUCTION else 'False') == 'True'

# ─────────────────────────────────────────────────────────────────
# Allowed Hosts
# AWS ALB health checks use the container's internal IP — must be allowed.
# ─────────────────────────────────────────────────────────────────
if IS_PRODUCTION:
    ALLOWED_HOSTS = [
        'api.ohc-ahc.com',
        '.ohc-ahc.com',
        '.amazonaws.com',  # Allow ALB DNS names directly
    ]
    # Dynamically allow container local IP for target group health checks
    try:
        import socket
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
        ALLOWED_HOSTS.append(local_ip)
        ALLOWED_HOSTS.append('localhost')
        ALLOWED_HOSTS.append('127.0.0.1')
    except Exception:
        pass
else:
    ALLOWED_HOSTS = [
        '127.0.0.1',
        'localhost',
        '10.150.224.239',
        'ohc-ahc.onrender.com',
    ]

# DJANGO_ALLOWED_HOSTS adds extra hosts in any environment (e.g. staging ALB, custom domains).
# Set as a comma-separated list in the ECS task definition environment variables.
_extra_hosts = os.getenv('DJANGO_ALLOWED_HOSTS', '')
if _extra_hosts:
    ALLOWED_HOSTS += [h.strip() for h in _extra_hosts.split(',') if h.strip()]


# ─────────────────────────────────────────────────────────────────
# Application Definition
# ─────────────────────────────────────────────────────────────────
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'django_filters',
    'corsheaders',
    'storages',      # django-storages — for S3 file storage in production
    'accounts',
    'ohc',
    'ahc',
    'payments',
    'reports',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'myproject.middleware.APIAuditMiddleware',
]

ROOT_URLCONF = 'myproject.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'myproject.wsgi.application'


# ─────────────────────────────────────────────────────────────────
# Database
# Production: PostgreSQL via DATABASE_URL injected by ECS from Secrets Manager
# Development: SQLite (easy, no setup needed)
#
# DATABASE_URL format: postgres://user:password@host:5432/dbname
# ─────────────────────────────────────────────────────────────────
DATABASE_URL = os.getenv('DATABASE_URL')
if DATABASE_URL:
    # Production: use the DATABASE_URL from AWS Secrets Manager
    # Format: postgres://user:password@host:5432/dbname
    import dj_database_url as dj_db
    DATABASES = {'default': dj_db.parse(
        DATABASE_URL, 
        conn_max_age=600,        # Keep DB connections alive for 10 minutes
        conn_health_checks=True, # Auto-reconnect if connection drops
        )}
else:
    # Local development: use SQLite
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }


# ─────────────────────────────────────────────────────────────────
# Password Validation
# ─────────────────────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# ─────────────────────────────────────────────────────────────────
# Internationalization
# ─────────────────────────────────────────────────────────────────
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# ─────────────────────────────────────────────────────────────────
# Static Files and Media
#
# Development: Served locally by Django (STATIC_URL = '/static/')
# Production:  Stored in S3, served through CloudFront CDN
# ─────────────────────────────────────────────────────────────────
if IS_PRODUCTION:
    AWS_S3_BUCKET = os.getenv('AWS_S3_BUCKET_NAME', 'ohc-ahc-production-static')
    AWS_S3_REGION_NAME = os.getenv('AWS_REGION', 'us-east-1')
    AWS_S3_CUSTOM_DOMAIN = os.getenv('CLOUDFRONT_DOMAIN')

    STORAGES = {
        'default': {
            'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage',
            'OPTIONS': {
                'bucket_name': AWS_S3_BUCKET,
                'location': 'media',
                'default_acl': None,
            }
        },
        'staticfiles': {
            'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage',
            'OPTIONS': {
                'bucket_name': AWS_S3_BUCKET,
                'location': 'static',
                'default_acl': None,
            }
        },
    }
    STATIC_URL = f'https://{AWS_S3_CUSTOM_DOMAIN or f"{AWS_S3_BUCKET}.s3.amazonaws.com"}/static/'
    MEDIA_URL  = f'https://{AWS_S3_CUSTOM_DOMAIN or f"{AWS_S3_BUCKET}.s3.amazonaws.com"}/media/'
    STATIC_ROOT = '/tmp/staticfiles'
else:
    STATIC_URL = '/static/'
    STATIC_ROOT = BASE_DIR / 'staticfiles'
    STATICFILES_DIRS = [BASE_DIR / 'static'] if (BASE_DIR / 'static').exists() else []
    MEDIA_URL = '/media/'
    MEDIA_ROOT = BASE_DIR / 'media'


# ─────────────────────────────────────────────────────────────────
# CORS (Cross-Origin Resource Sharing)
# Development: Allow all origins (easy local development)
# Production:  Only allow your real domains (security!)
# ─────────────────────────────────────────────────────────────────
CORS_ALLOW_CREDENTIALS = True

if IS_PRODUCTION:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = [
        'https://ohc-ahc.com',
        'https://www.ohc-ahc.com',
        'https://staging.ohc-ahc.com',
    ]
else:
    CORS_ALLOW_ALL_ORIGINS = True
    CORS_ALLOWED_ORIGINS = [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
    ]


# ─────────────────────────────────────────────────────────────────
# Security Settings (only enforced in production)
# ─────────────────────────────────────────────────────────────────
if IS_PRODUCTION:
    SECURE_SSL_REDIRECT = False  # ALB handles HTTPS termination, don't redirect again
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'


# ─────────────────────────────────────────────────────────────────
# Auth
# ─────────────────────────────────────────────────────────────────
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'accounts.User'
LOGIN_URL = '/login'
LOGIN_REDIRECT_URL = '/dashboard'
LOGOUT_REDIRECT_URL = '/'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}


# ─────────────────────────────────────────────────────────────────
# Logging — send all logs to stdout so CloudWatch captures them
# ─────────────────────────────────────────────────────────────────
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
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO' if IS_PRODUCTION else 'DEBUG',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO' if IS_PRODUCTION else 'DEBUG',
            'propagate': False,
        },
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}