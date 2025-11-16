"""
Direct Messages views
"""
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages as django_messages
from django.utils.translation import gettext as _
from django.utils import timezone
from django.db.models import Q
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from accounts.models import CustomUser
from .models import DirectMessage
from .forms import DirectMessageForm, ReplyMessageForm
from notifications.models import Notification


@login_required
@ensure_csrf_cookie
def inbox_view(request):
    """View all received messages"""
    user = request.user
    
    # Get messages where user is recipient or sent to all admins (recipient is None and user is admin)
    if user.is_official():
        messages = DirectMessage.objects.filter(
            Q(recipient=user) | Q(recipient__isnull=True)
        ).filter(parent_message__isnull=True).order_by('is_read', '-created_at')
    else:
        messages = DirectMessage.objects.filter(
            recipient=user,
            parent_message__isnull=True
        ).order_by('is_read', '-created_at')
    
    # Count unread messages
    unread_count = messages.filter(is_read=False).count()
    
    context = {
        'messages': messages,
        'unread_count': unread_count,
        'inbox_active': True,
    }
    
    return render(request, 'messages/inbox.html', context)


@login_required
def sent_messages_view(request):
    """View all sent messages"""
    messages = DirectMessage.objects.filter(
        sender=request.user,
        parent_message__isnull=True
    )
    
    context = {
        'messages': messages,
        'sent_active': True,
    }
    
    return render(request, 'messages/sent.html', context)


@login_required
def compose_message_view(request):
    """Compose a new message"""
    if request.method == 'POST':
        form = DirectMessageForm(request.POST, user=request.user)
        if form.is_valid():
            message = form.save(commit=False)
            message.sender = request.user
            
            # Handle recipient based on user role
            if request.user.is_official():
                # Admin selected recipient from form
                message.recipient = form.cleaned_data.get('recipient')
            else:
                # Resident sends to chairman or secretary
                chairman = CustomUser.objects.filter(role='chairman', is_approved=True).first()
                if chairman:
                    message.recipient = chairman
                else:
                    # Send to any secretary if no chairman
                    secretary = CustomUser.objects.filter(role='secretary', is_approved=True).first()
                    if secretary:
                        message.recipient = secretary
            
            message.save()
            
            # Create notification for recipient
            if message.recipient:
                Notification.objects.create(
                    user=message.recipient,
                    title=_("New Message"),
                    message=_("You have received a new message from {sender}: {subject}").format(
                        sender=message.sender.get_full_name() or message.sender.username,
                        subject=message.subject
                    ),
                    notification_type='message'
                )
            
            django_messages.success(request, _("Message sent successfully!"))
            return redirect('direct_messages:sent')
    else:
        form = DirectMessageForm(user=request.user)
    
    context = {
        'form': form,
        'compose_active': True,
    }
    
    return render(request, 'messages/compose.html', context)


@login_required
def message_detail_view(request, pk):
    """View message details and replies"""
    message = get_object_or_404(DirectMessage, pk=pk)
    
    # Check if user has permission to view this message
    if message.recipient:
        if request.user != message.sender and request.user != message.recipient:
            django_messages.error(request, _("You don't have permission to view this message."))
            return redirect('direct_messages:inbox')
    else:
        # Message sent to all admins
        if request.user != message.sender and not request.user.is_official():
            django_messages.error(request, _("You don't have permission to view this message."))
            return redirect('direct_messages:inbox')
    
    # Mark as read if user is recipient
    if request.user == message.recipient or (message.recipient is None and request.user.is_official()):
        message.mark_as_read()
        
        # Also mark related "message" notifications as read so the bell badge clears
        Notification.objects.filter(
            user=request.user,
            notification_type='message',
            is_read=False,
        ).update(is_read=True, read_at=timezone.now())
    
    # Get all replies
    replies = message.replies.all()
    
    # Handle reply form
    if request.method == 'POST':
        form = ReplyMessageForm(request.POST)
        if form.is_valid():
            reply = form.save(commit=False)
            reply.sender = request.user
            reply.recipient = message.sender if request.user == message.recipient else message.recipient
            reply.subject = f"Re: {message.subject}"
            reply.parent_message = message
            reply.save()
            
            # Create notification for recipient
            if reply.recipient:
                Notification.objects.create(
                    user=reply.recipient,
                    title=_("New Reply"),
                    message=_("{sender} replied to your message: {subject}").format(
                        sender=reply.sender.get_full_name() or reply.sender.username,
                        subject=message.subject
                    ),
                    notification_type='message'
                )
            
            django_messages.success(request, _("Reply sent successfully!"))
            return redirect('direct_messages:detail', pk=pk)
    else:
        form = ReplyMessageForm()
    
    context = {
        'message': message,
        'replies': replies,
        'form': form,
    }
    
    return render(request, 'messages/detail.html', context)


@login_required
def delete_message_view(request, pk):
    """Delete a message"""
    message = get_object_or_404(DirectMessage, pk=pk)
    
    # Check if user has permission to delete
    if request.user != message.sender and request.user != message.recipient:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({'success': False, 'error': 'Permission denied'}, status=403)
        django_messages.error(request, _("You don't have permission to delete this message."))
        return redirect('direct_messages:inbox')
    
    if request.method == 'POST':
        message.delete()
        
        # Return JSON for AJAX requests
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.content_type == 'application/json':
            return JsonResponse({'success': True, 'message': 'Message deleted successfully'})
        
        django_messages.success(request, _("Message deleted successfully!"))
        return redirect('direct_messages:inbox')
    
    context = {
        'message': message,
    }
    
    return render(request, 'messages/delete_confirm.html', context)


@login_required
def unread_count_api(request):
    """API endpoint to get unread message count"""
    user = request.user
    
    # Get unread messages
    if user.is_official():
        unread_count = DirectMessage.objects.filter(
            Q(recipient=user) | Q(recipient__isnull=True),
            is_read=False,
            parent_message__isnull=True
        ).count()
    else:
        unread_count = DirectMessage.objects.filter(
            recipient=user,
            is_read=False,
            parent_message__isnull=True
        ).count()
    
    return JsonResponse({'unread_count': unread_count})
