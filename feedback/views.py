"""
Feedback app views
"""
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.utils.translation import gettext as _
from django.utils import timezone
from django.db.models import Count, Avg, Q
from django.core.paginator import Paginator
from .models import Feedback
from .forms import FeedbackForm


@login_required
def submit_feedback(request):
    """Submit feedback with optional file"""
    if request.method == 'POST':
        form = FeedbackForm(request.POST, request.FILES)
        if form.is_valid():
            feedback = form.save(commit=False)
            feedback.user = request.user
            feedback.save()
            
            messages.success(request, _('Thank you for your feedback!'))
            return redirect('feedback:feedback_list')
    else:
        form = FeedbackForm()
    
    return render(request, 'feedback/submit_feedback.html', {'form': form})


@login_required
def feedback_list(request):
    """Role-scoped feedback list with filters and stats"""
    if request.user.is_official():
        feedbacks = Feedback.objects.all()
    else:
        feedbacks = Feedback.objects.filter(user=request.user)
    
    # Filters
    rating = request.GET.get('rating')
    if rating:
        feedbacks = feedbacks.filter(rating=rating)
    
    is_reviewed = request.GET.get('is_reviewed')
    if is_reviewed == 'true':
        feedbacks = feedbacks.filter(is_reviewed=True)
    elif is_reviewed == 'false':
        feedbacks = feedbacks.filter(is_reviewed=False)
    
    search = request.GET.get('search')
    if search:
        feedbacks = feedbacks.filter(
            Q(subject__icontains=search) | Q(message__icontains=search)
        )
    
    # Statistics
    total = feedbacks.count()
    reviewed = feedbacks.filter(is_reviewed=True).count()
    avg_rating = feedbacks.aggregate(Avg('rating'))['rating__avg'] or 0
    
    # Pagination
    paginator = Paginator(feedbacks, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'total': total,
        'reviewed': reviewed,
        'avg_rating': round(avg_rating, 1),
        'rating': rating,
        'is_reviewed': is_reviewed,
        'search': search,
    }
    
    return render(request, 'feedback/feedback_list.html', context)


@login_required
def feedback_detail(request, pk):
    """Feedback detail with admin response"""
    feedback = get_object_or_404(Feedback, pk=pk)
    
    # Access control
    if not request.user.is_official() and feedback.user != request.user:
        messages.error(request, _('Access denied.'))
        return redirect('feedback:feedback_list')
    
    # Mark as reviewed (officials only)
    if request.method == 'POST' and request.user.is_official():
        admin_response = request.POST.get('admin_response', '')
        feedback.is_reviewed = True
        feedback.reviewed_at = timezone.now()
        feedback.reviewed_by = request.user
        feedback.admin_response = admin_response
        feedback.save()
        
        messages.success(request, _('Feedback marked as reviewed.'))
        return redirect('feedback:feedback_detail', pk=pk)
    
    return render(request, 'feedback/feedback_detail.html', {'feedback': feedback})


@login_required
def feedback_statistics(request):
    """Feedback statistics view"""
    if not request.user.is_official():
        messages.error(request, _('Access denied.'))
        return redirect('feedback:feedback_list')
    
    total = Feedback.objects.count()
    reviewed = Feedback.objects.filter(is_reviewed=True).count()
    unreviewed = total - reviewed
    
    # Rating distribution
    rating_dist = Feedback.objects.values('rating').annotate(count=Count('id')).order_by('rating')
    
    # Average rating
    avg_rating = Feedback.objects.aggregate(Avg('rating'))['rating__avg'] or 0
    
    # Monthly trends (last 6 months)
    from datetime import datetime, timedelta
    six_months_ago = datetime.now() - timedelta(days=180)
    monthly_data = Feedback.objects.filter(
        created_at__gte=six_months_ago
    ).extra(
        select={'month': 'strftime("%%Y-%%m", created_at)'}
    ).values('month').annotate(count=Count('id')).order_by('month')
    
    context = {
        'total': total,
        'reviewed': reviewed,
        'unreviewed': unreviewed,
        'avg_rating': round(avg_rating, 1),
        'rating_dist': rating_dist,
        'monthly_data': monthly_data,
    }
    
    return render(request, 'feedback/feedback_statistics.html', context)


def feedback_statistics_api(request):
    """API: Feedback statistics JSON"""
    total = Feedback.objects.count()
    reviewed = Feedback.objects.filter(is_reviewed=True).count()
    
    # Rating distribution
    rating_dist = dict(Feedback.objects.values_list('rating').annotate(count=Count('id')))
    
    # Average rating
    avg_rating = Feedback.objects.aggregate(Avg('rating'))['rating__avg'] or 0
    
    data = {
        'total': total,
        'reviewed': reviewed,
        'unreviewed': total - reviewed,
        'avg_rating': round(avg_rating, 1),
        'rating_distribution': rating_dist,
    }
    
    return JsonResponse(data)

