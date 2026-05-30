# Django Dockerfile (React already built locally)
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
COPY myproject/requirements.txt ./myproject/
RUN pip install --no-cache-dir -r myproject/requirements.txt

# Copy Django project (includes pre-built React in static/react)
COPY myproject/ ./myproject/

# Collect static files
RUN cd myproject && python manage.py collectstatic --noinput --clear

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/admin/ || exit 1

# Run server with gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "120", "myproject.wsgi:application"]