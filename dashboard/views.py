"""
Dashboard app views
"""
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.utils.translation import gettext as _
from complaints.models import Complaint
from feedback.models import Feedback
from announcements.models import Announcement
from services.models import ServiceRequest
from notifications.models import Notification
from django.db.models import Count, Q
from django.utils import timezone


@login_required
def dashboard_home(request):
    """Redirect to role-based dashboard"""
    user = request.user
    
    if not user.is_approved:
        return redirect('accounts:wait_approval')
    
    if user.is_chairman():
        return redirect('dashboard:chairman')
    elif user.is_secretary():
        return redirect('dashboard:secretary')
    else:
        return redirect('dashboard:resident')


@login_required
def resident_dashboard(request):
    """Resident dashboard"""
    user = request.user
    
    # Use aggregate to get counts in a single query
    from django.db.models import Count, Q
    
    complaint_stats = Complaint.objects.filter(user=user).aggregate(
        pending=Count('id', filter=Q(status='pending')),
        resolved=Count('id', filter=Q(status='resolved'))
    )
    
    service_stats = ServiceRequest.objects.filter(user=user).aggregate(
        pending=Count('id', filter=Q(status='pending'))
    )
    
    # Recent activity - select related to avoid N+1 queries
    recent_complaints = Complaint.objects.filter(user=user).select_related('category')[:5]
    recent_services = ServiceRequest.objects.filter(user=user).select_related('service', 'service__category')[:5]
    
    # Unread notifications count
    unread_notifications = Notification.objects.filter(user=user, is_read=False).count()
    
    # Latest announcements
    latest_announcements = Announcement.objects.filter(
        status='published',
        publish_date__lte=timezone.now()
    ).exclude(
        expiry_date__lt=timezone.now()
    ).select_related('created_by')[:5]
    
    context = {
        'pending_complaints': complaint_stats['pending'],
        'resolved_complaints': complaint_stats['resolved'],
        'pending_services': service_stats['pending'],
        'recent_complaints': recent_complaints,
        'recent_services': recent_services,
        'unread_notifications': unread_notifications,
        'latest_announcements': latest_announcements,
    }
    
    return render(request, 'dashboard/resident_dashboard.html', context)


@login_required
def secretary_dashboard(request):
    """Secretary dashboard"""
    if not request.user.is_secretary():
        return redirect('dashboard:home')
    
    # Optimized: Use single aggregation query for complaint stats
    complaint_stats = Complaint.objects.aggregate(
        total=Count('id'),
        pending=Count('id', filter=Q(status='pending')),
        in_progress=Count('id', filter=Q(status='in_progress')),
        resolved=Count('id', filter=Q(status='resolved'))
    )
    
    # Optimized: Use single aggregation query for service stats
    service_stats = ServiceRequest.objects.aggregate(
        total=Count('id'),
        pending=Count('id', filter=Q(status='pending'))
    )
    
    # Optimized: Get other stats in a single aggregation query
    other_stats = {
        'pending_announcements': Announcement.objects.filter(status='pending').count(),
        'unreviewed_feedback': Feedback.objects.filter(is_reviewed=False).count()
    }
    
    # Recent activity with select_related to avoid N+1
    recent_complaints = Complaint.objects.select_related('user', 'category').order_by('-created_at')[:10]
    recent_services = ServiceRequest.objects.select_related('user', 'service').order_by('-created_at')[:10]
    
    context = {
        'total_complaints': complaint_stats['total'],
        'pending_complaints': complaint_stats['pending'],
        'in_progress': complaint_stats['in_progress'],
        'resolved_complaints': complaint_stats['resolved'],
        'total_services': service_stats['total'],
        'pending_services': service_stats['pending'],
        'pending_announcements': other_stats['pending_announcements'],
        'unreviewed_feedback': other_stats['unreviewed_feedback'],
        'recent_complaints': recent_complaints,
        'recent_services': recent_services,
    }
    
    return render(request, 'dashboard/secretary_dashboard.html', context)


@login_required
def chairman_dashboard(request):
    """Chairman dashboard"""
    if not request.user.is_chairman():
        return redirect('dashboard:home')
    
    from django.db.models import Avg
    
    # Optimized: User statistics in one query
    user_stats = request.user.__class__.objects.aggregate(
        total=Count('id'),
        pending=Count('id', filter=Q(is_approved=False)),
        active_residents=Count('id', filter=Q(is_approved=True, role='resident', is_deactivated=False))
    )
    
    # Optimized: Complaints stats in one query
    complaint_stats = Complaint.objects.aggregate(
        total=Count('id'),
        pending=Count('id', filter=Q(status='pending')),
        in_progress=Count('id', filter=Q(status='in_progress')),
        resolved=Count('id', filter=Q(status='resolved'))
    )
    resolution_rate = (complaint_stats['resolved'] / complaint_stats['total'] * 100) if complaint_stats['total'] > 0 else 0
    
    # Optimized: Service stats in one query
    service_stats = ServiceRequest.objects.aggregate(
        total=Count('id'),
        pending=Count('id', filter=Q(status='pending'))
    )
    
    # Optimized: Announcement stats in one query
    announcement_stats = Announcement.objects.aggregate(
        total=Count('id'),
        pending=Count('id', filter=Q(status='pending'))
    )
    
    # Optimized: Feedback stats in one query
    feedback_stats = Feedback.objects.aggregate(
        total=Count('id'),
        unreviewed=Count('id', filter=Q(is_reviewed=False)),
        avg_rating=Avg('rating')
    )
    
    # Category breakdown
    complaints_by_category = Complaint.objects.values('category__name').annotate(
        count=Count('id')
    ).order_by('-count')[:5]
    
    # Recent activity with select_related to avoid N+1 queries
    recent_complaints = Complaint.objects.select_related('user', 'category').order_by('-created_at')[:10]
    recent_feedback = Feedback.objects.select_related('user').order_by('-created_at')[:5]
    
    context = {
        'total_users': user_stats['total'],
        'pending_approvals': user_stats['pending'],
        'active_residents': user_stats['active_residents'],
        'total_complaints': complaint_stats['total'],
        'pending_complaints': complaint_stats['pending'],
        'in_progress': complaint_stats['in_progress'],
        'resolved_complaints': complaint_stats['resolved'],
        'resolution_rate': round(resolution_rate, 1),
        'total_services': service_stats['total'],
        'pending_services': service_stats['pending'],
        'total_announcements': announcement_stats['total'],
        'pending_announcements': announcement_stats['pending'],
        'total_feedback': feedback_stats['total'],
        'unreviewed_feedback': feedback_stats['unreviewed'],
        'avg_rating': feedback_stats['avg_rating'] or 0,
        'complaints_by_category': complaints_by_category,
        'recent_complaints': recent_complaints,
        'recent_feedback': recent_feedback,
    }
    
    return render(request, 'dashboard/chairman_dashboard.html', context)


@login_required
def reports_view(request):
    """Date-filtered complaint reports with breakdowns"""
    if not request.user.is_official():
        return redirect('dashboard:home')
    
    # Date filters
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    
    complaints = Complaint.objects.all()
    
    if start_date:
        complaints = complaints.filter(created_at__gte=start_date)
    if end_date:
        complaints = complaints.filter(created_at__lte=end_date)
    
    # Statistics - optimized
    stats = complaints.aggregate(
        total=Count('id'),
        resolved=Count('id', filter=Q(status='resolved'))
    )
    total = stats['total']
    resolved = stats['resolved']
    
    by_status = complaints.values('status').annotate(count=Count('id'))
    by_category = complaints.values('category__name').annotate(count=Count('id')).order_by('-count')
    by_priority = complaints.values('priority').annotate(count=Count('id'))
    
    # Resolution stats
    resolution_rate = (resolved / total * 100) if total > 0 else 0
    
    context = {
        'start_date': start_date,
        'end_date': end_date,
        'total': total,
        'by_status': by_status,
        'by_category': by_category,
        'by_priority': by_priority,
        'resolution_rate': round(resolution_rate, 1),
    }
    
    return render(request, 'dashboard/reports.html', context)

