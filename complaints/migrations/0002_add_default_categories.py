# Generated migration to add default complaint categories

from django.db import migrations


def create_default_categories(apps, schema_editor):
    """Create default complaint categories"""
    ComplaintCategory = apps.get_model('complaints', 'ComplaintCategory')
    
    categories = [
        {
            'name': 'Infrastructure',
            'description': 'Roads, bridges, buildings, and public facilities',
            'icon': 'fa-road'
        },
        {
            'name': 'Sanitation',
            'description': 'Garbage collection, drainage, and cleanliness issues',
            'icon': 'fa-trash'
        },
        {
            'name': 'Public Safety',
            'description': 'Security, lighting, and emergency concerns',
            'icon': 'fa-shield-alt'
        },
        {
            'name': 'Noise',
            'description': 'Noise pollution and disturbances',
            'icon': 'fa-volume-up'
        },
        {
            'name': 'Water Supply',
            'description': 'Water availability and quality issues',
            'icon': 'fa-tint'
        },
        {
            'name': 'Electricity',
            'description': 'Power supply and street lighting problems',
            'icon': 'fa-bolt'
        },
        {
            'name': 'Health',
            'description': 'Health services and medical concerns',
            'icon': 'fa-heartbeat'
        },
        {
            'name': 'Community Relations',
            'description': 'Neighbor disputes and community issues',
            'icon': 'fa-users'
        },
        {
            'name': 'Animals',
            'description': 'Stray animals and pet-related concerns',
            'icon': 'fa-dog'
        },
        {
            'name': 'Others',
            'description': 'Other concerns not listed above',
            'icon': 'fa-ellipsis-h'
        },
    ]
    
    for category_data in categories:
        ComplaintCategory.objects.get_or_create(
            name=category_data['name'],
            defaults={
                'description': category_data['description'],
                'icon': category_data['icon']
            }
        )


def remove_default_categories(apps, schema_editor):
    """Remove default categories (reverse operation)"""
    ComplaintCategory = apps.get_model('complaints', 'ComplaintCategory')
    category_names = [
        'Infrastructure', 'Sanitation', 'Public Safety', 'Noise',
        'Water Supply', 'Electricity', 'Health', 'Community Relations',
        'Animals', 'Others'
    ]
    ComplaintCategory.objects.filter(name__in=category_names).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('complaints', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_categories, remove_default_categories),
    ]

