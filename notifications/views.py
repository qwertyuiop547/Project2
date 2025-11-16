"""
Notifications app views
"""
import json
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse, HttpResponseBadRequest
from django.utils.translation import gettext as _
from django.utils import timezone
from django.core.paginator import Paginator
from .models import Notification, NotificationPreference
from direct_messages.models import DirectMessage


@login_required
def notification_list(request):
    """User inbox with optional mark all read"""
    # Base queryset
    notifications_qs = Notification.objects.filter(user=request.user)
    
    # Filter by read/unread
    filter_type = request.GET.get('filter', 'all')
    if filter_type == 'unread':
        notifications_qs = notifications_qs.filter(is_read=False)
    elif filter_type == 'read':
        notifications_qs = notifications_qs.filter(is_read=True)
    
    # Counts for badges
    total_count = notifications_qs.count()
    unread_count = Notification.objects.filter(user=request.user, is_read=False).count()
    
    # Pagination
    paginator = Paginator(notifications_qs, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        # For template compatibility: use both page_obj and notifications
        'page_obj': page_obj,
        'notifications': page_obj,
        'unread_count': unread_count,
        'filter': filter_type,
        'total_count': total_count,
        'is_paginated': page_obj.has_other_pages(),
    }
    
    return render(request, 'notifications/notification_list.html', context)


@login_required
def notification_detail(request, pk):
    """Notification detail (marks as read)"""
    notification = get_object_or_404(Notification, pk=pk, user=request.user)
    
    # Mark as read
    if not notification.is_read:
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
    
    return render(request, 'notifications/notification_detail.html', {'notification': notification})


@login_required
def mark_notification_read(request, pk):
    """Mark single notification as read"""
    notification = get_object_or_404(Notification, pk=pk, user=request.user)
    notification.is_read = True
    notification.read_at = timezone.now()
    notification.save()
    
    messages.success(request, _('Notification marked as read.'))
    return redirect('notifications:notification_list')


@login_required
def mark_all_notifications_read(request):
    """Mark all notifications as read"""
    Notification.objects.filter(user=request.user, is_read=False).update(
        is_read=True,
        read_at=timezone.now()
    )
    
    messages.success(request, _('All notifications marked as read.'))
    return redirect('notifications:notification_list')


@login_required
def delete_notification(request, pk):
    """Delete single notification"""
    notification = get_object_or_404(Notification, pk=pk, user=request.user)
    notification.delete()
    
    messages.success(request, _('Notification deleted.'))
    return redirect('notifications:notification_list')


@login_required
def delete_all_notifications(request):
    """Delete all notifications"""
    if request.method == 'POST':
        Notification.objects.filter(user=request.user).delete()
        messages.success(request, _('All notifications deleted.'))
    
    return redirect('notifications:notification_list')


@login_required
def notification_preferences(request):
    """Notification preferences"""
    preferences, created = NotificationPreference.objects.get_or_create(user=request.user)
    
    if request.method == 'POST':
        # Update preferences
        preferences.email_announcements = request.POST.get('email_announcements') == 'on'
        preferences.email_complaints = request.POST.get('email_complaints') == 'on'
        preferences.email_services = request.POST.get('email_services') == 'on'
        preferences.app_announcements = request.POST.get('app_announcements') == 'on'
        preferences.app_complaints = request.POST.get('app_complaints') == 'on'
        preferences.app_services = request.POST.get('app_services') == 'on'
        preferences.save()
        
        messages.success(request, _('Preferences updated.'))
        return redirect('notifications:notification_preferences')
    
    return render(request, 'notifications/notification_preferences.html', {'preferences': preferences})


@login_required
def get_unread_notifications_count(request):
    """API: Get unread count"""
    # Auto-sync message notifications with direct messages:
    # if user has no unread direct messages, mark all "message" notifications as read
    user = request.user
    
    has_unread_messages = DirectMessage.objects.filter(
        recipient=user,
        is_read=False,
        parent_message__isnull=True,
    ).exists()
    
    if not has_unread_messages:
        Notification.objects.filter(
            user=user,
            notification_type='message',
            is_read=False,
        ).update(is_read=True, read_at=timezone.now())
    
    count = Notification.objects.filter(user=user, is_read=False).count()
    return JsonResponse({'unread_count': count})


@login_required
def get_recent_notifications(request):
    """API: Get recent notifications"""
    notifications = Notification.objects.filter(user=request.user)[:10].values(
        'id', 'title', 'message', 'notification_type', 'is_read', 'created_at'
    )
    
    return JsonResponse({'notifications': list(notifications)})


@login_required
def delete_selected_notifications(request):
    """Delete selected notifications via AJAX"""
    if request.method != 'POST':
        return HttpResponseBadRequest('Invalid request method')

    try:
        data = json.loads(request.body.decode('utf-8'))
        ids = data.get('ids', [])
    except (json.JSONDecodeError, UnicodeDecodeError):
        return HttpResponseBadRequest('Invalid JSON data')

    if not isinstance(ids, list):
        return HttpResponseBadRequest('Invalid IDs payload')

    qs = Notification.objects.filter(user=request.user, pk__in=ids)
    deleted_count = qs.count()
    qs.delete()

    return JsonResponse({'deleted_count': deleted_count})

