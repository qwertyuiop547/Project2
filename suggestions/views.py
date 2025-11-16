"""
Suggestions app views
"""
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.utils.translation import gettext as _
from django.utils import timezone
from django.db.models import Q, Count
from django.core.paginator import Paginator
from .models import Suggestion, SuggestionVote
from .forms import SuggestionForm


def suggestion_list(request):
    """Public suggestion list with filters and stats"""
    suggestions = Suggestion.objects.select_related('user').annotate(
        vote_count_calc=Count('votes')
    )
    
    # Filters
    status = request.GET.get('status')
    if status:
        suggestions = suggestions.filter(status=status)
    
    search = request.GET.get('search')
    if search:
        suggestions = suggestions.filter(
            Q(title__icontains=search) | Q(description__icontains=search)
        )
    
    # Sort by votes
    sort_by = request.GET.get('sort', '-vote_count')
    if sort_by == 'votes':
        suggestions = suggestions.order_by('-vote_count')
    elif sort_by == 'recent':
        suggestions = suggestions.order_by('-created_at')
    else:
        suggestions = suggestions.order_by('-vote_count')
    
    # Statistics
    total = suggestions.count()
    pending = suggestions.filter(status='pending').count()
    approved = suggestions.filter(status='approved').count()
    
    # Track which suggestions current user has voted for (for UI state)
    user_voted_ids = []
    if request.user.is_authenticated:
        user_voted_ids = list(
            SuggestionVote.objects.filter(user=request.user).values_list('suggestion_id', flat=True)
        )
    
    # Pagination
    paginator = Paginator(suggestions, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'total': total,
        'pending': pending,
        'approved': approved,
        'status': status,
        'search': search,
        'sort': sort_by,
        'user_voted_ids': user_voted_ids,
    }
    
    return render(request, 'suggestions/suggestion_list.html', context)


def suggestion_detail(request, pk):
    """Suggestion detail"""
    suggestion = get_object_or_404(Suggestion, pk=pk)
    
    # Check if user has voted
    has_voted = False
    if request.user.is_authenticated:
        has_voted = SuggestionVote.objects.filter(suggestion=suggestion, user=request.user).exists()
    
    context = {
        'suggestion': suggestion,
        'has_voted': has_voted,
    }
    
    return render(request, 'suggestions/suggestion_detail.html', context)


@login_required
def submit_suggestion(request):
    """Submit a suggestion"""
    # Only approved residents can submit suggestions
    if not request.user.is_resident():
        messages.error(request, _('Only residents can submit suggestions.'))
        return redirect('suggestions:suggestion_list')
    if not request.user.is_approved:
        messages.error(request, _('Your account needs to be approved before you can submit suggestions.'))
        return redirect('suggestions:suggestion_list')
    if request.method == 'POST':
        form = SuggestionForm(request.POST)
        if form.is_valid():
            suggestion = form.save(commit=False)
            suggestion.user = request.user
            # Respect anonymity toggle from the form
            suggestion.is_anonymous = request.POST.get('is_anonymous') == 'on'
            # Get category from form
            category = request.POST.get('category', 'other')
            if category in dict(Suggestion.CATEGORY_CHOICES):
                suggestion.category = category
            # Status defaults to 'pending' - visible to all but awaiting official review
            suggestion.save()
            
            messages.success(request, _('Suggestion submitted! It is now visible to everyone and pending review.'))
            return redirect('suggestions:suggestion_list')
    else:
        form = SuggestionForm()
    
    return render(request, 'suggestions/submit_suggestion.html', {'form': form})


@login_required
def my_suggestions(request):
    """User's own suggestions"""
    suggestions = Suggestion.objects.filter(user=request.user)
    
    # Pagination
    paginator = Paginator(suggestions, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    return render(request, 'suggestions/my_suggestions.html', {'page_obj': page_obj})


@login_required
def vote_suggestion(request):
    """AJAX: Toggle vote on suggestion"""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=400)

    # Only approved residents can vote (NOT officials like secretary/chairman)
    if not request.user.is_resident() or request.user.is_official():
        return JsonResponse({'error': 'Only residents can vote on suggestions. Officials cannot vote.'}, status=403)
    
    # Also check if resident is approved
    if not request.user.is_approved:
        return JsonResponse({'error': 'Your account needs to be approved before you can vote.'}, status=403)
    
    suggestion_id = request.POST.get('suggestion_id')
    suggestion = get_object_or_404(Suggestion, pk=suggestion_id)
    
    vote, created = SuggestionVote.objects.get_or_create(suggestion=suggestion, user=request.user)
    
    if not created:
        # Unvote
        vote.delete()
        suggestion.vote_count = max(0, suggestion.vote_count - 1)
        suggestion.save(update_fields=['vote_count'])
        return JsonResponse({'voted': False, 'vote_count': suggestion.vote_count})
    else:
        # Vote
        suggestion.vote_count += 1
        suggestion.save(update_fields=['vote_count'])
        return JsonResponse({'voted': True, 'vote_count': suggestion.vote_count})


@login_required
def manage_suggestions(request):
    """Manage suggestions (officials)"""
    if not request.user.is_official():
        messages.error(request, _('Access denied.'))
        return redirect('suggestions:suggestion_list')
    
    suggestions = Suggestion.objects.all()
    
    # Filters
    status = request.GET.get('status')
    if status:
        suggestions = suggestions.filter(status=status)
    
    # Statistics
    total = suggestions.count()
    pending = suggestions.filter(status='pending').count()
    under_review = suggestions.filter(status='under_review').count()
    approved = suggestions.filter(status='approved').count()
    implemented = suggestions.filter(status='implemented').count()
    
    # Pagination
    paginator = Paginator(suggestions, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'total': total,
        'pending': pending,
        'under_review': under_review,
        'approved': approved,
        'implemented': implemented,
        'status': status,
    }
    
    return render(request, 'suggestions/manage_suggestions.html', context)


@login_required
def review_suggestion(request, pk):
    """Review suggestion (status update + reviewer) - CHAIRMAN/ADMIN ONLY"""
    # Strict check: Only chairman/superadmin can review (NOT secretary)
    if not request.user.is_chairman():
        messages.error(request, _('Access denied. Only administrators can review suggestions.'))
        return redirect('suggestions:suggestion_list')
    
    suggestion = get_object_or_404(Suggestion, pk=pk)
    
    if request.method == 'POST':
        # Double-check on POST as well
        if not request.user.is_chairman():
            messages.error(request, _('Access denied. Only administrators can review suggestions.'))
            return redirect('suggestions:suggestion_list')
            
        new_status = request.POST.get('status')
        
        suggestion.status = new_status
        suggestion.reviewed_by = request.user
        suggestion.reviewed_at = timezone.now()
        suggestion.save()
        
        messages.success(request, _('Suggestion reviewed.'))
        return redirect('suggestions:manage_suggestions')
    
    return render(request, 'suggestions/review_suggestion.html', {'suggestion': suggestion})


@login_required
def approve_suggestion(request, pk):
    """Quick-approve a suggestion (chairman/admin only)."""
    if not request.user.is_chairman():
        messages.error(request, _('Access denied. Only administrators can approve suggestions.'))
        return redirect('suggestions:suggestion_list')

    suggestion = get_object_or_404(Suggestion, pk=pk)

    if request.method == 'POST':
        suggestion.status = 'approved'
        suggestion.reviewed_by = request.user
        suggestion.reviewed_at = timezone.now()
        suggestion.save(update_fields=['status', 'reviewed_by', 'reviewed_at'])
        
        messages.success(request, _('Suggestion approved.'))
    
    return redirect('suggestions:manage_suggestions')


@login_required
def reject_suggestion(request, pk):
    """Quick-reject a suggestion (chairman/admin only)."""
    if not request.user.is_chairman():
        messages.error(request, _('Access denied. Only administrators can reject suggestions.'))
        return redirect('suggestions:suggestion_list')

    suggestion = get_object_or_404(Suggestion, pk=pk)

    if request.method == 'POST':
        suggestion.status = 'rejected'
        suggestion.reviewed_by = request.user
        suggestion.reviewed_at = timezone.now()
        suggestion.save(update_fields=['status', 'reviewed_by', 'reviewed_at'])
        
        messages.success(request, _('Suggestion rejected.'))
    
    return redirect('suggestions:manage_suggestions')

