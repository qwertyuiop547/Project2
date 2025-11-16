"""
Analytics app views
"""
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.utils.translation import gettext as _
from django.db.models import Count, Avg, Q
from datetime import datetime, timedelta
from complaints.models import Complaint, ComplaintCategory
from feedback.models import Feedback
from accounts.models import CustomUser


@login_required
def analytics_overview(request):
    """System metrics, category/priority breakdown, trends, top complainants"""
    if not request.user.is_official():
        messages.error(request, _('Access denied.'))
        return redirect('dashboard:home')
    
    # Overall statistics
    total_users = CustomUser.objects.count()
    total_residents = CustomUser.objects.filter(role='resident', is_approved=True).count()
    total_complaints = Complaint.objects.count()
    total_feedback = Feedback.objects.count()
    
    # Complaint status breakdown
    complaints_by_status = Complaint.objects.values('status').annotate(count=Count('id'))
    
    # Complaint category breakdown
    complaints_by_category = Complaint.objects.values('category__name').annotate(
        count=Count('id')
    ).order_by('-count')[:10]
    
    # Priority breakdown
    complaints_by_priority = Complaint.objects.values('priority').annotate(count=Count('id'))
    
    # Resolution rate
    resolved = Complaint.objects.filter(status='resolved').count()
    resolution_rate = (resolved / total_complaints * 100) if total_complaints > 0 else 0
    
    # Top complainants
    top_complainants = Complaint.objects.values('user__username').annotate(
        count=Count('id')
    ).order_by('-count')[:10]
    
    # Monthly trends (last 6 months)
    six_months_ago = datetime.now() - timedelta(days=180)
    monthly_complaints = Complaint.objects.filter(
        created_at__gte=six_months_ago
    ).extra(
        select={'month': 'strftime("%%Y-%%m", created_at)'}
    ).values('month').annotate(count=Count('id')).order_by('month')
    
    context = {
        'total_users': total_users,
        'total_residents': total_residents,
        'total_complaints': total_complaints,
        'total_feedback': total_feedback,
        'complaints_by_status': complaints_by_status,
        'complaints_by_category': complaints_by_category,
        'complaints_by_priority': complaints_by_priority,
        'resolution_rate': round(resolution_rate, 1),
        'top_complainants': top_complainants,
        'monthly_complaints': monthly_complaints,
    }
    
    return render(request, 'analytics/analytics_overview.html', context)


@login_required
def analytics_complaints(request):
    """Time series, weekly status, category performance"""
    if not request.user.is_official():
        messages.error(request, _('Access denied.'))
        return redirect('dashboard:home')
    
    # Time series (last 30 days)
    thirty_days_ago = datetime.now() - timedelta(days=30)
    daily_complaints = Complaint.objects.filter(
        created_at__gte=thirty_days_ago
    ).extra(
        select={'date': 'date(created_at)'}
    ).values('date').annotate(count=Count('id')).order_by('date')
    
    # Weekly status breakdown
    seven_days_ago = datetime.now() - timedelta(days=7)
    weekly_by_status = Complaint.objects.filter(
        created_at__gte=seven_days_ago
    ).values('status').annotate(count=Count('id'))
    
    # Category performance (resolution times)
    category_performance = []
    for category in ComplaintCategory.objects.all():
        cat_complaints = Complaint.objects.filter(category=category)
        total = cat_complaints.count()
        resolved = cat_complaints.filter(status='resolved').count()
        resolution_rate = (resolved / total * 100) if total > 0 else 0
        
        category_performance.append({
            'category': category.name,
            'total': total,
            'resolved': resolved,
            'resolution_rate': round(resolution_rate, 1),
        })
    
    # Average resolution time (simple calculation)
    resolved_complaints = Complaint.objects.filter(
        status='resolved',
        resolved_at__isnull=False
    )
    
    context = {
        'daily_complaints': daily_complaints,
        'weekly_by_status': weekly_by_status,
        'category_performance': category_performance,
        'resolved_count': resolved_complaints.count(),
    }
    
    return render(request, 'analytics/analytics_complaints.html', context)


@login_required
def analytics_feedback(request):
    """Rating distribution, monthly trends, response rates"""
    if not request.user.is_official():
        messages.error(request, _('Access denied.'))
        return redirect('dashboard:home')
    
    # Rating distribution
    rating_distribution = Feedback.objects.values('rating').annotate(count=Count('id')).order_by('rating')
    
    # Average rating
    avg_rating = Feedback.objects.aggregate(Avg('rating'))['rating__avg'] or 0
    
    # Monthly trends (last 6 months)
    six_months_ago = datetime.now() - timedelta(days=180)
    monthly_feedback = Feedback.objects.filter(
        created_at__gte=six_months_ago
    ).extra(
        select={'month': 'strftime("%%Y-%%m", created_at)'}
    ).values('month').annotate(count=Count('id')).order_by('month')
    
    # Response rates
    total_feedback = Feedback.objects.count()
    reviewed_feedback = Feedback.objects.filter(is_reviewed=True).count()
    response_rate = (reviewed_feedback / total_feedback * 100) if total_feedback > 0 else 0
    
    context = {
        'rating_distribution': rating_distribution,
        'avg_rating': round(avg_rating, 1),
        'monthly_feedback': monthly_feedback,
        'total_feedback': total_feedback,
        'reviewed_feedback': reviewed_feedback,
        'response_rate': round(response_rate, 1),
    }
    
    return render(request, 'analytics/analytics_feedback.html', context)


@login_required
def analytics_export(request):
    """Export analytics data as JSON"""
    if not request.user.is_official():
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    export_type = request.GET.get('type', 'overview')
    
    if export_type == 'overview':
        data = {
            'total_users': CustomUser.objects.count(),
            'total_complaints': Complaint.objects.count(),
            'total_feedback': Feedback.objects.count(),
            'complaints_by_status': dict(Complaint.objects.values_list('status').annotate(count=Count('id'))),
            'complaints_by_priority': dict(Complaint.objects.values_list('priority').annotate(count=Count('id'))),
        }
    elif export_type == 'complaints':
        data = {
            'total': Complaint.objects.count(),
            'by_status': dict(Complaint.objects.values_list('status').annotate(count=Count('id'))),
            'by_category': list(Complaint.objects.values('category__name').annotate(count=Count('id'))),
            'by_priority': dict(Complaint.objects.values_list('priority').annotate(count=Count('id'))),
        }
    elif export_type == 'feedback':
        data = {
            'total': Feedback.objects.count(),
            'reviewed': Feedback.objects.filter(is_reviewed=True).count(),
            'rating_distribution': dict(Feedback.objects.values_list('rating').annotate(count=Count('id'))),
            'avg_rating': Feedback.objects.aggregate(Avg('rating'))['rating__avg'] or 0,
        }
    else:
        return JsonResponse({'error': 'Invalid export type'}, status=400)
    
    return JsonResponse(data)

