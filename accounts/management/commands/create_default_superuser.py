from django.core.management.base import BaseCommand
from accounts.models import CustomUser
from django.db import IntegrityError


class Command(BaseCommand):
    help = 'Creates a default superuser if none exists'

    def handle(self, *args, **options):
        # Check if any superuser exists
        if CustomUser.objects.filter(is_superuser=True).exists():
            self.stdout.write(self.style.WARNING('Superuser already exists. Skipping creation.'))
            return

        try:
            # Create default superuser
            superuser = CustomUser.objects.create_superuser(
                username='superadmin',
                email='admin@barangay.local',
                password='Admin@2024',
                first_name='Super',
                last_name='Admin',
                role='admin'
            )
            self.stdout.write(self.style.SUCCESS(f'Successfully created superuser: {superuser.username}'))
            self.stdout.write(self.style.SUCCESS('Username: superadmin'))
            self.stdout.write(self.style.SUCCESS('Password: Admin@2024'))
            self.stdout.write(self.style.WARNING('IMPORTANT: Change this password immediately after first login!'))
        except IntegrityError as e:
            self.stdout.write(self.style.ERROR(f'Error creating superuser: {e}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Unexpected error: {e}'))
