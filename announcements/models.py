"""
Announcements models
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from accounts.models import CustomUser


class Announcement(models.Model):
    """Public announcements"""
    
    STATUS_CHOICES = [
        ('draft', _('Draft')),
        ('pending', _('Pending Approval')),
        ('approved', _('Approved')),
        ('rejected', _('Rejected')),
        ('published', _('Published')),
    ]
    
    PRIORITY_CHOICES = [
        ('low', _('Low')),
        ('normal', _('Normal')),
        ('high', _('High')),
        ('urgent', _('Urgent')),
    ]
    
    CATEGORY_CHOICES = [
        ('general', _('General')),
        ('events', _('Events')),
        ('urgent', _('Urgent')),
        ('maintenance', _('Maintenance')),
        ('community', _('Community')),
    ]
    
    title = models.CharField(max_length=255)
    content = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='general')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='normal')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Publishing
    created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='created_announcements')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    publish_date = models.DateTimeField(null=True, blank=True)
    expiry_date = models.DateTimeField(null=True, blank=True)
    
    # Approval workflow
    approved_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_announcements')
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Engagement
    view_count = models.IntegerField(default=0)
    
    # Attachments
    image = models.ImageField(upload_to='announcement_images/', blank=True, null=True)
    
    class Meta:
        verbose_name = _('Announcement')
        verbose_name_plural = _('Announcements')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'publish_date']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['expiry_date']),
        ]
    
    def __str__(self):
        return self.title


class AnnouncementNotification(models.Model):
    """Track announcement notifications sent to users"""
    announcement = models.ForeignKey(Announcement, on_delete=models.CASCADE, related_name='notifications')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='announcement_notifications')
    sent_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = _('Announcement Notification')
        verbose_name_plural = _('Announcement Notifications')
        unique_together = ['announcement', 'user']
    
    def __str__(self):
        return f"{self.announcement.title} → {self.user.username}"

