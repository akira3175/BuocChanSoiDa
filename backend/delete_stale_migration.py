import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

with connection.cursor() as cursor:
    cursor.execute("DELETE FROM django_migrations WHERE app='users' AND name='0002_tour_poi'")
    print(f"Deleted {cursor.rowcount} rows.")
