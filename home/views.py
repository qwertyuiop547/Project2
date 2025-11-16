"""
Home app views
"""
from django.shortcuts import render
from django.http import JsonResponse
from django.utils.translation import gettext as _
from accounts.models import CustomUser
from complaints.models import Complaint
from announcements.models import Announcement
from django.utils import timezone


def index(request):
    """Home page with public stats and latest announcements"""
    from django.db.models import Count, Q
    from django.core.cache import cache
    
    # Cache public stats for 2 minutes
    stats = cache.get('home_page_stats')
    if stats is None:
        # Optimized: Get user and complaint stats in two queries instead of three
        user_stats = CustomUser.objects.aggregate(
            total_residents=Count('id', filter=Q(is_approved=True, role='resident'))
        )
        
        complaint_stats = Complaint.objects.aggregate(
            total=Count('id'),
            resolved=Count('id', filter=Q(status='resolved'))
        )
        
        resolution_rate = (complaint_stats['resolved'] / complaint_stats['total'] * 100) if complaint_stats['total'] > 0 else 0
        
        stats = {
            'total_residents': user_stats['total_residents'],
            'total_complaints': complaint_stats['total'],
            'resolved_complaints': complaint_stats['resolved'],
            'resolution_rate': round(resolution_rate, 1),
        }
        cache.set('home_page_stats', stats, 120)  # Cache for 2 minutes
    
    # Latest approved announcements - with select_related for author
    latest_announcements = Announcement.objects.filter(
        status='published',
        publish_date__lte=timezone.now()
    ).exclude(
        expiry_date__lt=timezone.now()
    ).select_related('created_by')[:5]
    
    context = {
        **stats,
        'latest_announcements': latest_announcements,
    }
    
    return render(request, 'home/index.html', context)


def quick_stats_api(request):
    """JSON API for quick stats (AJAX)"""
    total_residents = CustomUser.objects.filter(is_approved=True, role='resident').count()
    total_complaints = Complaint.objects.count()
    pending_complaints = Complaint.objects.filter(status='pending').count()
    resolved_complaints = Complaint.objects.filter(status='resolved').count()
    resolution_rate = (resolved_complaints / total_complaints * 100) if total_complaints > 0 else 0
    
    data = {
        'total_residents': total_residents,
        'total_complaints': total_complaints,
        'pending_complaints': pending_complaints,
        'resolved_complaints': resolved_complaints,
        'resolution_rate': round(resolution_rate, 1),
    }
    
    return JsonResponse(data)


def aurora_test(request):
    """Test page for Aurora background"""
    return render(request, 'aurora_test.html')
