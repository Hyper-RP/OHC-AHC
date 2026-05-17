web: cd myproject && gunicorn myproject.wsgi:application --bind 0.0.0.0:$PORT
release: cd myproject && python manage.py migrate --noinput