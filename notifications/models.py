"""
Notifications models
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from accounts.models import CustomUser


class Notification(models.Model):
    """User notifications"""
    
    TYPE_CHOICES = [
        ('info', _('Information')),
        ('success', _('Success')),
        ('warning', _('Warning')),
        ('error', _('Error')),
        ('announcement', _('Announcement')),
        ('complaint', _('Complaint')),
        ('service', _('Service')),
    ]
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='info')
    
    # Link to related object
    link = models.CharField(max_length=255, blank=True)
    
    # Read status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('Notification')
        verbose_name_plural = _('Notifications')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read', '-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"


class NotificationPreference(models.Model):
    """User notification preferences"""
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='notification_preferences')
    
    # Email notifications
    email_announcements = models.BooleanField(default=True)
    email_complaints = models.BooleanField(default=True)
    email_services = models.BooleanField(default=True)
    
    # In-app notifications
    app_announcements = models.BooleanField(default=True)
    app_complaints = models.BooleanField(default=True)
    app_services = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = _('Notification Preference')
        verbose_name_plural = _('Notification Preferences')
    
    def __str__(self):
        return f"Preferences for {self.user.username}"

