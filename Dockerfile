# Multi-stage build for Django + React
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY frontend/ ./
RUN npm run build

# Python stage
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/myproject \
    DJANGO_SETTINGS_MODULE=myproject.settings

WORKDIR /app

# Install Python dependencies
COPY myproject/requirements.txt ./myproject/requirements.txt
RUN pip install --no-cache-dir --user -r myproject/requirements.txt

# Copy project files
COPY myproject/ ./myproject/

# Copy React build from frontend stage
COPY --from=frontend-builder /app/frontend/dist ./myproject/static/react/

# Collect static files
RUN cd myproject && python manage.py collectstatic --noinput --clear

# Expose port
EXPOSE 8000

# Health check - check if server responds
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/admin/ || exit 1

# Run server (use gunicorn in production)
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "120", "myproject.wsgi:application"]