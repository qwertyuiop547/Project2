"""
Complaints app views
"""
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.utils.translation import gettext as _
from django.utils import timezone
from django.db.models import Q, Count, Avg
from django.core.paginator import Paginator
from .models import (
    Complaint, ComplaintCategory, ComplaintAttachment, 
    ComplaintComment, ComplaintStatusHistory
)
from .forms import ComplaintForm, ComplaintCommentForm, ComplaintRatingForm
import random
import string


def complaint_list(request):
    """Optimized complaint list with role scoping, filters, and stats"""
    complaints = Complaint.objects.select_related('category', 'user').prefetch_related('attachments')
    
    # Role-based filtering
    if request.user.is_authenticated:
        if not request.user.is_official():
            # Regular users see only their own NON-anonymous complaints,
            # plus anonymous complaints that have been marked as non-internal.
            # This preserves anonymity while still allowing aggregate visibility.
            complaints = complaints.filter(
                Q(user=request.user, is_anonymous=False) |
                Q(is_anonymous=True, is_internal=False)
            )
    else:
        # Anonymous visitors see no complaints
        complaints = complaints.none()
    
    # Filters
    status = request.GET.get('status')
    if status:
        complaints = complaints.filter(status=status)
    
    category = request.GET.get('category')
    if category:
        complaints = complaints.filter(category_id=category)
    
    priority = request.GET.get('priority')
    if priority:
        complaints = complaints.filter(priority=priority)
    
    search = request.GET.get('search')
    if search:
        complaints = complaints.filter(
            Q(title__icontains=search) | Q(description__icontains=search)
        )
    
    # Statistics
    total = complaints.count()
    pending = complaints.filter(status='pending').count()
    resolved = complaints.filter(status='resolved').count()
    
    # Pagination
    paginator = Paginator(complaints, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Categories for filter
    categories = ComplaintCategory.objects.all()
    
    context = {
        'page_obj': page_obj,
        'is_paginated': page_obj.has_other_pages(),
        'is_official': request.user.is_authenticated and request.user.is_official(),
        'categories': categories,
        'total': total,
        'pending': pending,
        'resolved': resolved,
        'status': status,
        'category': category,
        'priority': priority,
        'search': search,
    }
    
    return render(request, 'complaints/complaint_list.html', context)


@login_required
def create_complaint(request):
    """Create complaint (anonymous or authenticated with attachments)"""
    # Only residents can file complaints through this form
    if not request.user.is_resident():
        messages.error(request, _('Only residents can submit complaints.'))
        return redirect('complaints:complaint_list')

    if request.method == 'POST':
        form = ComplaintForm(request.POST, request.FILES)
        if form.is_valid():
            complaint = form.save(commit=False)

            # Check if anonymous (privacy control)
            is_anonymous = request.POST.get('is_anonymous') == 'on'
            complaint.is_anonymous = is_anonymous
            # Always keep a link to the submitting user in the database so that
            # authorized officials (e.g. chairman) can see the identity, while
            # the UI hides it from residents/unauthorized staff.
            complaint.user = request.user
            
            complaint.save()
            
            # Handle attachments
            attachments = request.FILES.getlist('attachments')
            for attachment in attachments:
                ComplaintAttachment.objects.create(
                    complaint=complaint,
                    file=attachment,
                    uploaded_by=request.user
                )
            
            if is_anonymous:
                return redirect('complaints:anonymous_success')
            
            messages.success(request, _('Complaint submitted successfully!'))
            return redirect('complaints:complaint_detail', pk=complaint.pk)
    else:
        form = ComplaintForm()
    
    return render(request, 'complaints/create_complaint.html', {'form': form})


def complaint_detail(request, pk):
    """View complaint with chairman comments/attachments"""
    complaint = get_object_or_404(Complaint, pk=pk)
    
    # Access control
    if request.user.is_authenticated:
        if not request.user.is_official():
            # Regular users can only see their own
            if complaint.user != request.user:
                messages.error(request, _('Access denied.'))
                return redirect('complaints:complaint_list')
    else:
        messages.error(request, _('Please login to view complaints.'))
        return redirect('accounts:login')
    
    # Filter comments based on role
    if request.user.is_official():
        comments = complaint.comments.all()
    else:
        # Residents only see non-internal comments
        comments = complaint.comments.filter(is_internal=False)
    
    # Comment & rating forms
    comment_form = ComplaintCommentForm()
    rating_form = None

    if complaint.status in ['resolved', 'closed'] and complaint.user == request.user:
        rating_form = ComplaintRatingForm(instance=complaint)

    if request.method == 'POST':
        if 'comment_submit' in request.POST:
            comment_form = ComplaintCommentForm(request.POST)
            if comment_form.is_valid():
                comment = comment_form.save(commit=False)
                comment.complaint = complaint
                comment.user = request.user
                comment.save()
                messages.success(request, _('Comment added.'))
                return redirect('complaints:complaint_detail', pk=pk)
        elif 'rating_submit' in request.POST and rating_form is not None:
            rating_form = ComplaintRatingForm(request.POST, instance=complaint)
            if rating_form.is_valid():
                rating_form.save()
                messages.success(request, _('Thank you for rating this complaint resolution.'))
                return redirect('complaints:complaint_detail', pk=pk)
    
    context = {
        'complaint': complaint,
        'comments': comments,
        'comment_form': comment_form,
        'rating_form': rating_form,
        'priority_choices': Complaint.PRIORITY_CHOICES,
    }
    
    return render(request, 'complaints/complaint_detail.html', context)


@login_required
def update_complaint(request, pk):
    """Update complaint with valid status transitions"""
    if not request.user.is_official():
        messages.error(request, _('Access denied.'))
        return redirect('complaints:complaint_list')
    
    complaint = get_object_or_404(Complaint, pk=pk)
    
    if request.method == 'POST':
        new_status = request.POST.get('status')
        notes = request.POST.get('notes', '')
        
        # Validate status transition - full timeline:
        # pending (Submitted) → under_review → in_progress → resolved → closed
        valid_transitions = {
            'pending': ['under_review', 'rejected'],
            'under_review': ['in_progress', 'rejected'],
            'in_progress': ['resolved', 'under_review'],
            'resolved': ['closed', 'in_progress'],
            'closed': [],
            'rejected': ['pending'],
        }
        
        if new_status not in valid_transitions.get(complaint.status, []):
            messages.error(request, _('Invalid status transition.'))
            return redirect('complaints:complaint_detail', pk=pk)
        
        # Create status history
        ComplaintStatusHistory.objects.create(
            complaint=complaint,
            old_status=complaint.status,
            new_status=new_status,
            changed_by=request.user,
            notes=notes
        )
        
        # Update complaint
        old_status = complaint.status
        complaint.status = new_status
        
        if new_status == 'under_review' and old_status == 'pending':
            complaint.accepted_at = timezone.now()
        elif new_status == 'in_progress' and old_status in ['pending', 'under_review']:
            # Keep accepted_at for first time it moves out of pending
            if not complaint.accepted_at:
                complaint.accepted_at = timezone.now()
        elif new_status == 'resolved':
            complaint.resolved_at = timezone.now()
        elif new_status == 'closed':
            complaint.closed_at = timezone.now()
        
        complaint.save()
        
        messages.success(request, _('Complaint status updated.'))
        return redirect('complaints:complaint_detail', pk=pk)
    
    return redirect('complaints:complaint_detail', pk=pk)


@login_required
def accept_complaint(request, pk):
    """Accept complaint (Secretary/Chairman → under_review)
    
    Intended flow:
    - Resident submits complaint → status 'pending' (Submitted)
    - Secretary reviews and accepts → status moves to 'under_review'
    - Chairman then moves to 'in_progress', resolves, and closes.
    """
    if not (request.user.is_secretary() or request.user.is_chairman()):
        messages.error(request, _('Access denied.'))
        return redirect('complaints:complaint_list')
    
    complaint = get_object_or_404(Complaint, pk=pk)
    
    if complaint.status != 'pending':
        messages.error(request, _('Can only accept newly submitted complaints.'))
        return redirect('complaints:complaint_detail', pk=pk)
    
    # Create status history for move to under_review
    ComplaintStatusHistory.objects.create(
        complaint=complaint,
        old_status='pending',
        new_status='under_review',
        changed_by=request.user,
        notes='Complaint accepted for review'
    )
    
    complaint.status = 'under_review'
    complaint.accepted_at = timezone.now()
    complaint.save()
    
    messages.success(request, _('Complaint accepted.'))
    return redirect('complaints:complaint_detail', pk=pk)


@login_required
def update_priority(request, pk):
    """Update complaint priority (Secretary only)"""
    if not request.user.is_secretary():
        messages.error(request, _('Access denied.'))
        return redirect('complaints:complaint_detail', pk=pk)

    complaint = get_object_or_404(Complaint, pk=pk)

    if request.method == 'POST':
        new_priority = request.POST.get('priority')
        valid_priorities = [choice[0] for choice in Complaint.PRIORITY_CHOICES]
        if new_priority in valid_priorities:
            complaint.priority = new_priority
            complaint.save(update_fields=['priority'])
            messages.success(request, _('Priority updated.'))
        else:
            messages.error(request, _('Invalid priority value.'))

    return redirect('complaints:complaint_detail', pk=pk)


@login_required
def mark_resolved(request, pk):
    """Mark complaint as resolved (Chairman, optional proof)"""
    if not request.user.is_chairman():
        messages.error(request, _('Access denied.'))
        return redirect('complaints:complaint_list')
    
    complaint = get_object_or_404(Complaint, pk=pk)
    
    if request.method == 'POST':
        resolution_notes = request.POST.get('resolution_notes', '')
        proof_file = request.FILES.get('proof')
        
        # Create status history
        ComplaintStatusHistory.objects.create(
            complaint=complaint,
            old_status=complaint.status,
            new_status='resolved',
            changed_by=request.user,
            notes=resolution_notes
        )
        
        complaint.status = 'resolved'
        complaint.resolved_at = timezone.now()
        complaint.resolution_notes = resolution_notes
        complaint.save()
        
        # Add proof if provided
        if proof_file:
            ComplaintAttachment.objects.create(
                complaint=complaint,
                file=proof_file,
                uploaded_by=request.user,
                is_proof=True,
                description='Resolution proof'
            )
        
        messages.success(request, _('Complaint marked as resolved.'))
        return redirect('complaints:complaint_detail', pk=pk)
    
    return render(request, 'complaints/mark_resolved.html', {'complaint': complaint})


@login_required
def close_complaint(request, pk):
    """Close complaint (from resolved)"""
    if not request.user.is_chairman():
        messages.error(request, _('Access denied.'))
        return redirect('complaints:complaint_list')
    
    complaint = get_object_or_404(Complaint, pk=pk)
    
    if complaint.status != 'resolved':
        messages.error(request, _('Can only close resolved complaints.'))
        return redirect('complaints:complaint_detail', pk=pk)
    
    # Create status history
    ComplaintStatusHistory.objects.create(
        complaint=complaint,
        old_status='resolved',
        new_status='closed',
        changed_by=request.user,
        notes='Complaint closed'
    )
    
    complaint.status = 'closed'
    complaint.closed_at = timezone.now()
    complaint.save()
    
    messages.success(request, _('Complaint closed.'))
    return redirect('complaints:complaint_detail', pk=pk)


@login_required
def delete_complaint(request, pk):
    """Delete complaint (resolved/closed only)"""
    if not request.user.is_chairman():
        messages.error(request, _('Access denied.'))
        return redirect('complaints:complaint_list')
    
    complaint = get_object_or_404(Complaint, pk=pk)
    
    if complaint.status not in ['resolved', 'closed']:
        messages.error(request, _('Can only delete resolved or closed complaints.'))
        return redirect('complaints:complaint_detail', pk=pk)
    
    if request.method == 'POST':
        complaint.delete()
        messages.success(request, _('Complaint deleted.'))
        return redirect('complaints:complaint_list')
    
    return render(request, 'complaints/delete_complaint.html', {'complaint': complaint})


@login_required
def delete_attachment(request, attachment_id):
    """Delete complaint attachment"""
    attachment = get_object_or_404(ComplaintAttachment, pk=attachment_id)
    
    # Only owner or officials can delete
    if not (request.user.is_official() or attachment.uploaded_by == request.user):
        messages.error(request, _('Access denied.'))
        return redirect('complaints:complaint_detail', pk=attachment.complaint.pk)
    
    complaint_pk = attachment.complaint.pk
    attachment.delete()
    
    messages.success(request, _('Attachment deleted.'))
    return redirect('complaints:complaint_detail', pk=complaint_pk)


def complaint_statistics_api(request):
    """API: Aggregates + category breakdown"""
    total = Complaint.objects.count()
    by_status = dict(Complaint.objects.values_list('status').annotate(count=Count('id')))
    by_category = list(Complaint.objects.values('category__name').annotate(count=Count('id')).order_by('-count'))
    by_priority = dict(Complaint.objects.values_list('priority').annotate(count=Count('id')))
    
    resolved = Complaint.objects.filter(status='resolved').count()
    resolution_rate = (resolved / total * 100) if total > 0 else 0
    
    data = {
        'total': total,
        'by_status': by_status,
        'by_category': by_category,
        'by_priority': by_priority,
        'resolution_rate': round(resolution_rate, 1),
    }
    
    return JsonResponse(data)


def complaint_tracking_api(request, pk):
    """API: AI timeline, ETA, confidence, assignment"""
    complaint = get_object_or_404(Complaint, pk=pk)
    
    # Calculate timeline
    history = complaint.status_history.all().values('new_status', 'changed_at', 'changed_by__username')
    
    # Estimate ETA (simple logic)
    if complaint.status == 'pending':
        eta_days = 7
        confidence = 50
    elif complaint.status == 'in_progress':
        eta_days = 3
        confidence = 70
    elif complaint.status == 'resolved':
        eta_days = 0
        confidence = 100
    else:
        eta_days = 0
        confidence = 100
    
    data = {
        'complaint_id': complaint.id,
        'status': complaint.status,
        'timeline': list(history),
        'eta_days': eta_days,
        'confidence': confidence,
        'assigned_to': complaint.assigned_to.username if complaint.assigned_to else None,
        'estimated_resolution_date': str(complaint.estimated_resolution_date) if complaint.estimated_resolution_date else None,
    }
    
    return JsonResponse(data)


def anonymous_success(request):
    """Success page for anonymous complaints"""
    return render(request, 'complaints/anonymous_success.html')

