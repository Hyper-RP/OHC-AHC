# ================================================================
# OHC-AHC Multi-Stage Dockerfile
# ================================================================
# Stage 1 (builder): Installs all Python packages
# Stage 2 (production): Only the runtime — no build tools
#
# WHY multi-stage?
#   Single stage image: ~900MB (includes gcc, build tools)
#   Multi-stage image:  ~200MB (only Python runtime + your code)
#   Smaller = faster deploys + smaller attack surface
# ================================================================

# ── STAGE 1: Dependency Builder ──────────────────────────────────
# This stage downloads and compiles all Python packages.
# It will NOT be included in the final image.
FROM python:3.11-slim AS builder

# Install system build tools needed to compile Python packages like psycopg2
# These are large and only needed at build time, not at runtime
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# ── IMPORTANT: Copy requirements BEFORE copying source code ──────
# Docker builds in layers. If requirements.txt hasn't changed,
# Docker skips the pip install step entirely — saving 2-3 minutes per build!
COPY myproject/requirements.txt .

# Install packages to a specific prefix directory
# We'll copy just this directory to the final stage
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ── STAGE 2: Production Runtime ──────────────────────────────────
# This is the actual image that runs in production.
# It starts fresh from python:3.11-slim — no build tools here.
FROM python:3.11-slim AS production

# Install ONLY runtime system dependencies
# libpq5 = PostgreSQL client library (needed by psycopg2 at runtime)
# curl   = used by Docker health check
RUN apt-get update && apt-get install -y \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ── SECURITY: Create a non-root user ─────────────────────────────
# By default, Docker runs everything as root (uid=0).
# If an attacker exploits your app, they'd have root access inside the container.
# Running as a regular user limits the damage significantly.
RUN groupadd --gid 1000 appuser && \
    useradd --uid 1000 --gid appuser --shell /bin/bash --create-home appuser

# ── Environment Variables ─────────────────────────────────────────
ENV PYTHONDONTWRITEBYTECODE=1 \
    # PYTHONDONTWRITEBYTECODE=1: Don't create .pyc files (saves disk space)
    PYTHONUNBUFFERED=1 \
    # PYTHONUNBUFFERED=1: Print stdout/stderr immediately (important for logs)
    PYTHONPATH=/app/myproject \
    DJANGO_SETTINGS_MODULE=myproject.settings \
    # Port Gunicorn listens on
    PORT=8000

WORKDIR /app

# ── Copy compiled packages from builder stage ─────────────────────
# This is the magic of multi-stage builds — we get all the installed
# packages WITHOUT the build tools that compiled them
COPY --from=builder /install /usr/local

# ── Copy application source code ──────────────────────────────────
COPY myproject/ ./myproject/

# ── Collect Django static files ───────────────────────────────────
# This bundles all CSS/JS/images into one place so Django can serve them
# The React build (copied in CI) is included here too
RUN cd myproject && \
    python manage.py collectstatic --noinput --clear && \
    echo "✅ Static files collected"

# ── Set correct file ownership ────────────────────────────────────
RUN chown -R appuser:appuser /app

# ── Switch to non-root user ───────────────────────────────────────
USER appuser

# ── Expose port ───────────────────────────────────────────────────
EXPOSE 8000

# ── Health check ──────────────────────────────────────────────────
# Docker/ECS uses this to know if your container is healthy.
# If it fails 3 times in a row, ECS replaces the container automatically.
HEALTHCHECK \
    --interval=30s \
    --timeout=10s \
    --start-period=60s \
    --retries=3 \
    CMD curl -f http://localhost:8000/health/ || exit 1

# ── Production Server ─────────────────────────────────────────────
# Gunicorn = production WSGI server (Django's built-in server is NOT for production)
# --workers 4        = 4 worker processes (handles requests in parallel)
# --threads 2        = 2 threads per worker (better for I/O-bound requests)
# --timeout 120      = kill a worker if it takes > 120 seconds
# --access-logfile - = log requests to stdout (CloudWatch picks this up)
# --error-logfile -  = log errors to stdout
CMD ["gunicorn", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "4", \
     "--threads", "2", \
     "--timeout", "120", \
     "--keep-alive", "5", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "--log-level", "info", \
     "--capture-output", \
     "myproject.wsgi:application"]
