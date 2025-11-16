#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

# Ensure migrations are applied
python manage.py makemigrations --noinput
python manage.py migrate --noinput

# Create default superuser if none exists
python manage.py create_default_superuser

python manage.py collectstatic --no-input
