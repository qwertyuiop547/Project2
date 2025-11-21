"""
Announcements app views
"""
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.utils.translation import gettext as _
from django.utils import timezone
from django.db.models import Q
from django.core.paginator import Paginator
from .models import Announcement, AnnouncementNotification
from .forms import AnnouncementForm


def announcement_list(request):
    """Public announcements (approved, published, unexpired)"""
    # Optimized: Add select_related to avoid N+1 queries
    announcements = Announcement.objects.filter(
        status='published',
        publish_date__lte=timezone.now()
    ).exclude(
        expiry_date__lt=timezone.now()
    ).select_related('created_by')
    
    # Filters
    priority = request.GET.get('priority')
    if priority:
        announcements = announcements.filter(priority=priority)
    
    search = request.GET.get('search')
    if search:
        announcements = announcements.filter(
            Q(title__icontains=search) | Q(content__icontains=search)
        )
    
    # Pagination
    paginator = Paginator(announcements, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'priority': priority,
        'search': search,
    }
    
    return render(request, 'announcements/announcement_list.html', context)


def announcement_detail(request, pk):
    """Announcement detail with view counter"""
    announcement = get_object_or_404(Announcement, pk=pk)
    
    # Increment view count
    announcement.view_count += 1
    announcement.save(update_fields=['view_count'])
    
    return render(request, 'announcements/announcement_detail.html', {'announcement': announcement})


@login_required
def create_announcement(request):
    """Create announcement (Secretary only)"""
    # Only Secretary accounts can create announcements
    if not request.user.is_secretary():
        messages.error(request, _('Only the Secretary can create announcements.'))
        return redirect('announcements:announcement_list')
    
    if request.method == 'POST':
        form = AnnouncementForm(request.POST, request.FILES)
        if form.is_valid():
            announcement = form.save(commit=False)
            announcement.created_by = request.user

            # All new announcements from the Secretary are immediately published
            announcement.status = 'published'
            announcement.approved_by = request.user
            announcement.approved_at = timezone.now()
            announcement.publish_date = timezone.now()

            announcement.save()
            
            # Notify all residents
            notify_all_residents_about_announcement(announcement)
            
            messages.success(request, _('Announcement created and published successfully!'))
            return redirect('announcements:announcement_detail', pk=announcement.pk)
    else:
        form = AnnouncementForm()
    
    return render(request, 'announcements/create_announcement.html', {'form': form})


@login_required
def edit_announcement(request, pk):
    """Edit announcement"""
    if not request.user.is_official():
        messages.error(request, _('Access denied.'))
        return redirect('announcements:announcement_list')
    
    announcement = get_object_or_404(Announcement, pk=pk)
    
    # Only creator or chairman can edit
    if announcement.created_by != request.user and not request.user.is_chairman():
        messages.error(request, _('Access denied.'))
        return redirect('announcements:announcement_detail', pk=pk)
    
    if request.method == 'POST':
        form = AnnouncementForm(request.POST, request.FILES, instance=announcement)
        if form.is_valid():
            form.save()
            messages.success(request, _('Announcement updated successfully!'))
            return redirect('announcements:announcement_detail', pk=pk)
    else:
        form = AnnouncementForm(instance=announcement)
    
    return render(request, 'announcements/edit_announcement.html', {
        'form': form,
        'announcement': announcement,
    })


@login_required
def manage_announcements(request):
    """Manage announcements (officials)"""
    if not request.user.is_official():
        messages.error(request, _('Access denied.'))
        return redirect('announcements:announcement_list')
    
    # Optimized: Add select_related to avoid N+1 queries
    announcements = Announcement.objects.select_related('created_by', 'approved_by').order_by('-created_at')
    
    # Filter by status
    status = request.GET.get('status')
    if status:
        announcements = announcements.filter(status=status)
    
    # Pagination
    paginator = Paginator(announcements, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'status': status,
    }
    
    return render(request, 'announcements/manage_announcements.html', context)


@login_required
def pending_approvals(request):
    """Pending announcement approvals (Chairman)"""
    if not request.user.is_chairman():
        messages.error(request, _('Access denied.'))
        return redirect('announcements:announcement_list')
    
    pending = Announcement.objects.filter(status='pending')
    
    return render(request, 'announcements/pending_approvals.html', {'pending': pending})


@login_required
def approve_announcement(request, pk):
    """Approve announcement (Chairman)"""
    if not request.user.is_chairman():
        messages.error(request, _('Access denied.'))
        return redirect('announcements:announcement_list')
    
    announcement = get_object_or_404(Announcement, pk=pk)
    
    announcement.status = 'published'
    announcement.approved_by = request.user
    announcement.approved_at = timezone.now()
    announcement.publish_date = timezone.now()
    announcement.save()
    
    # Notify all residents
    notify_all_residents_about_announcement(announcement)
    
    messages.success(request, _('Announcement approved and published.'))
    return redirect('announcements:announcement_detail', pk=pk)


@login_required
def reject_announcement(request, pk):
    """Reject announcement (Chairman)"""
    if not request.user.is_chairman():
        messages.error(request, _('Access denied.'))
        return redirect('announcements:announcement_list')
    
    announcement = get_object_or_404(Announcement, pk=pk)
    
    if request.method == 'POST':
        rejection_reason = request.POST.get('rejection_reason', '')
        announcement.status = 'rejected'
        announcement.rejection_reason = rejection_reason
        announcement.save()
        
        messages.success(request, _('Announcement rejected.'))
        return redirect('announcements:pending_approvals')
    
    return render(request, 'announcements/reject_announcement.html', {'announcement': announcement})


@login_required
def delete_announcement(request, pk):
    """Delete announcement"""
    if not request.user.is_official():
        messages.error(request, _('Access denied.'))
        return redirect('announcements:announcement_list')
    
    announcement = get_object_or_404(Announcement, pk=pk)
    
    # Only creator or chairman can delete
    if announcement.created_by != request.user and not request.user.is_chairman():
        messages.error(request, _('Access denied.'))
        return redirect('announcements:announcement_detail', pk=pk)
    
    if request.method == 'POST':
        announcement.delete()
        messages.success(request, _('Announcement deleted.'))
        return redirect('announcements:manage_announcements')
    
    return render(request, 'announcements/delete_announcement.html', {'announcement': announcement})


@login_required
def my_notifications(request):
    """User's announcement notifications (mark read on view)"""
    notifications = AnnouncementNotification.objects.filter(user=request.user).select_related('announcement')
    
    # Mark all as read
    notifications.filter(is_read=False).update(is_read=True, read_at=timezone.now())
    
    # Pagination
    paginator = Paginator(notifications, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    return render(request, 'announcements/my_notifications.html', {'page_obj': page_obj})


# Helper functions
def create_announcement_notification(announcement, user):
    """Create notification for a user"""
    AnnouncementNotification.objects.get_or_create(
        announcement=announcement,
        user=user
    )


def notify_all_residents_about_announcement(announcement):
    """Notify all residents about new announcement - optimized with bulk_create"""
    from accounts.models import CustomUser
    from notifications.models import Notification
    
    residents = CustomUser.objects.filter(is_approved=True, role='resident')
    
    # Optimized: Use bulk_create to avoid N+1 queries
    announcement_notifications = []
    general_notifications = []
    
    for resident in residents:
        # Create announcement notification
        announcement_notifications.append(
            AnnouncementNotification(
                announcement=announcement,
                user=resident
            )
        )
        
        # Create general notification
        general_notifications.append(
            Notification(
                user=resident,
                title=_('New Announcement'),
                message=f'{announcement.title}',
                notification_type='announcement',
                link=f'/announcements/{announcement.id}/'
            )
        )
    
    # Bulk create all notifications at once
    if announcement_notifications:
        AnnouncementNotification.objects.bulk_create(
            announcement_notifications,
            ignore_conflicts=True  # Ignore if notification already exists
        )
    if general_notifications:
        Notification.objects.bulk_create(general_notifications)


def notify_chairman_for_approval(announcement):
    """Notify chairman that announcement needs approval"""
    from accounts.models import CustomUser
    from notifications.models import Notification
    
    chairmen = CustomUser.objects.filter(role='chairman', is_approved=True)
    
    for chairman in chairmen:
        Notification.objects.create(
            user=chairman,
            title=_('Announcement Pending Approval'),
            message=f'{announcement.title} by {announcement.created_by.username}',
            notification_type='announcement',
            link=f'/announcements/pending/'
        )

