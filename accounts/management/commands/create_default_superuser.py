from django.core.management.base import BaseCommand
from accounts.models import CustomUser
from django.db import IntegrityError


class Command(BaseCommand):
    help = 'Creates default users if they do not exist'

    def handle(self, *args, **options):
        # Default users configuration
        default_users = [
            {
                'username': 'superadmin',
                'email': 'admin@barangay.local',
                'password': 'Admin@2024',
                'first_name': 'Super',
                'last_name': 'Admin',
                'role': 'admin',
                'is_superuser': True,
                'is_staff': True
            },
            {
                'username': 'secretary',
                'email': 'secretary@barangay.local',
                'password': 'Secretary@2024',
                'first_name': 'Barangay',
                'last_name': 'Secretary',
                'role': 'secretary',
                'is_superuser': False,
                'is_staff': True
            },
            {
                'username': 'resident',
                'email': 'resident@barangay.local',
                'password': 'Resident@2024',
                'first_name': 'Test',
                'last_name': 'Resident',
                'role': 'resident',
                'is_superuser': False,
                'is_staff': False
            }
        ]

        created_count = 0
        skipped_count = 0

        for user_data in default_users:
            username = user_data['username']
            
            # Check if user already exists
            if CustomUser.objects.filter(username=username).exists():
                self.stdout.write(self.style.WARNING(f'User "{username}" already exists. Skipping.'))
                skipped_count += 1
                continue

            try:
                # Create user
                if user_data['is_superuser']:
                    user = CustomUser.objects.create_superuser(
                        username=user_data['username'],
                        email=user_data['email'],
                        password=user_data['password'],
                        first_name=user_data['first_name'],
                        last_name=user_data['last_name'],
                        role=user_data['role']
                    )
                else:
                    user = CustomUser.objects.create_user(
                        username=user_data['username'],
                        email=user_data['email'],
                        password=user_data['password'],
                        first_name=user_data['first_name'],
                        last_name=user_data['last_name'],
                        role=user_data['role'],
                        is_staff=user_data['is_staff']
                    )
                
                self.stdout.write(self.style.SUCCESS(f'✓ Created {user_data["role"]}: {username}'))
                created_count += 1
                
            except IntegrityError as e:
                self.stdout.write(self.style.ERROR(f'Error creating {username}: {e}'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Unexpected error creating {username}: {e}'))

        # Summary
        self.stdout.write(self.style.SUCCESS('\n' + '='*50))
        self.stdout.write(self.style.SUCCESS(f'Created: {created_count} users'))
        self.stdout.write(self.style.WARNING(f'Skipped: {skipped_count} users'))
        
        if created_count > 0:
            self.stdout.write(self.style.SUCCESS('\n**Default Login Credentials:**'))
            self.stdout.write(self.style.SUCCESS('- Username: superadmin | Password: Admin@2024'))
            self.stdout.write(self.style.SUCCESS('- Username: secretary  | Password: Secretary@2024'))
            self.stdout.write(self.style.SUCCESS('- Username: resident   | Password: Resident@2024'))
            self.stdout.write(self.style.WARNING('\nIMPORTANT: Change passwords after first login!'))
        self.stdout.write(self.style.SUCCESS('='*50))
