"""
Feedback models
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from accounts.models import CustomUser


class Feedback(models.Model):
    """User feedback model"""
    
    RATING_CHOICES = [
        (1, _('Very Poor')),
        (2, _('Poor')),
        (3, _('Average')),
        (4, _('Good')),
        (5, _('Excellent')),
    ]
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='feedbacks')
    subject = models.CharField(max_length=255)
    message = models.TextField()
    rating = models.IntegerField(choices=RATING_CHOICES, default=3)
    attachment = models.FileField(upload_to='feedback_attachments/', blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Review status
    is_reviewed = models.BooleanField(default=False)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_feedbacks')
    admin_response = models.TextField(blank=True)
    
    class Meta:
        verbose_name = _('Feedback')
        verbose_name_plural = _('Feedbacks')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.subject} - {self.user.username}"

