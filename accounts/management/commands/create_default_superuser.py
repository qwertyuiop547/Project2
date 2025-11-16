from django.core.management.base import BaseCommand
from accounts.models import CustomUser
from django.db import IntegrityError


class Command(BaseCommand):
    help = 'Creates default users if they do not exist'

    def handle(self, *args, **options):
        # First, delete existing default users to recreate them as approved
        default_usernames = ['superadmin', 'secretary', 'resident']
        deleted_count = 0
        
        for username in default_usernames:
            try:
                user = CustomUser.objects.filter(username=username).first()
                if user:
                    user.delete()
                    self.stdout.write(self.style.WARNING(f'Deleted existing user: {username}'))
                    deleted_count += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error deleting {username}: {e}'))
        
        if deleted_count > 0:
            self.stdout.write(self.style.SUCCESS(f'\nDeleted {deleted_count} existing users. Creating fresh approved users...\n'))
        
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
                'is_staff': True,
                'is_approved': True
            },
            {
                'username': 'secretary',
                'email': 'secretary@barangay.local',
                'password': 'Secretary@2024',
                'first_name': 'Barangay',
                'last_name': 'Secretary',
                'role': 'secretary',
                'is_superuser': False,
                'is_staff': True,
                'is_approved': True
            },
            {
                'username': 'resident',
                'email': 'resident@barangay.local',
                'password': 'Resident@2024',
                'first_name': 'Test',
                'last_name': 'Resident',
                'role': 'resident',
                'is_superuser': False,
                'is_staff': False,
                'is_approved': True
            }
        ]

        created_count = 0

        for user_data in default_users:
            username = user_data['username']
            
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
                
                # Approve the user automatically
                user.is_approved = True
                user.save()
                
                self.stdout.write(self.style.SUCCESS(f'✓ Created {user_data["role"]}: {username}'))
                created_count += 1
                
            except IntegrityError as e:
                self.stdout.write(self.style.ERROR(f'Error creating {username}: {e}'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Unexpected error creating {username}: {e}'))

        # Summary
        self.stdout.write(self.style.SUCCESS('\n' + '='*50))
        self.stdout.write(self.style.SUCCESS(f'Created: {created_count} users'))
        
        if created_count > 0:
            self.stdout.write(self.style.SUCCESS('\n**Default Login Credentials:**'))
            self.stdout.write(self.style.SUCCESS('- Username: superadmin | Password: Admin@2024'))
            self.stdout.write(self.style.SUCCESS('- Username: secretary  | Password: Secretary@2024'))
            self.stdout.write(self.style.SUCCESS('- Username: resident   | Password: Resident@2024'))
            self.stdout.write(self.style.WARNING('\nIMPORTANT: Change passwords after first login!'))
        self.stdout.write(self.style.SUCCESS('='*50))
