"""
Direct Messages models
"""
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class DirectMessage(models.Model):
    """Model for direct messages between residents and admins"""
    
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages',
        verbose_name=_("Sender")
    )
    
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_messages',
        verbose_name=_("Recipient"),
        null=True,
        blank=True,
        help_text=_("Leave blank to send to all admins")
    )
    
    subject = models.CharField(
        max_length=200,
        verbose_name=_("Subject")
    )
    
    message = models.TextField(
        verbose_name=_("Message")
    )
    
    parent_message = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies',
        verbose_name=_("Parent Message")
    )
    
    is_read = models.BooleanField(
        default=False,
        verbose_name=_("Read Status")
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Created At")
    )
    
    read_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Read At")
    )
    
    class Meta:
        verbose_name = _("Direct Message")
        verbose_name_plural = _("Direct Messages")
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.subject} - From: {self.sender.username}"
    
    def mark_as_read(self):
        """Mark message as read"""
        from django.utils import timezone
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()
