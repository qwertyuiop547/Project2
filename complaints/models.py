"""
Complaints models
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from accounts.models import CustomUser


class ComplaintCategory(models.Model):
    """Categories for complaints"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)
    
    class Meta:
        verbose_name = _('Complaint Category')
        verbose_name_plural = _('Complaint Categories')
    
    def __str__(self):
        return self.name


class Complaint(models.Model):
    """Main complaint model"""
    
    STATUS_CHOICES = [
        # Submitted by resident
        ('pending', _('Submitted')),
        # Being checked/verified by officials
        ('under_review', _('Under Review')),
        # Actively being handled
        ('in_progress', _('In Progress')),
        # Resolution has been applied
        ('resolved', _('Resolved')),
        # Fully closed (e.g., after resident feedback)
        ('closed', _('Closed')),
        # Explicitly rejected
        ('rejected', _('Rejected')),
    ]
    
    PRIORITY_CHOICES = [
        ('low', _('Low')),
        ('medium', _('Medium')),
        ('high', _('High')),
        ('urgent', _('Urgent')),
    ]
    
    # Basic info
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.ForeignKey(ComplaintCategory, on_delete=models.SET_NULL, null=True, related_name='complaints')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    
    # User info
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='complaints', null=True, blank=True)
    is_anonymous = models.BooleanField(default=False)
    anonymous_reference = models.CharField(max_length=20, blank=True, null=True, unique=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    
    # Assignment and tracking
    assigned_to = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_complaints')
    estimated_resolution_date = models.DateField(null=True, blank=True)
    # Reason for delay when actual resolution passes ETA or takes long
    delay_reason = models.TextField(blank=True)
    # Simple resident rating after resolution (1–5) + optional feedback
    rating = models.PositiveSmallIntegerField(null=True, blank=True)
    rating_feedback = models.TextField(blank=True)
    
    # Internal tracking
    is_internal = models.BooleanField(default=False)
    chairman_notes = models.TextField(blank=True)
    resolution_notes = models.TextField(blank=True)
    
    class Meta:
        verbose_name = _('Complaint')
        verbose_name_plural = _('Complaints')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['category', 'status']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.status}"
    
    def save(self, *args, **kwargs):
        # Ensure non-anonymous complaints don't keep any anonymous reference
        if not self.is_anonymous:
            self.anonymous_reference = None

        # Generate anonymous reference if needed (for tracking without identity)
        if self.is_anonymous and not self.anonymous_reference:
            import random
            import string

            # Keep trying until we find an unused reference (very unlikely to loop)
            while True:
                reference = ''.join(
                    random.choices(string.ascii_uppercase + string.digits, k=10)
                )
                if not Complaint.objects.filter(anonymous_reference=reference).exists():
                    self.anonymous_reference = reference
                    break
        super().save(*args, **kwargs)


class ComplaintAttachment(models.Model):
    """Attachments for complaints"""
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='complaint_attachments/')
    uploaded_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    description = models.CharField(max_length=255, blank=True)
    is_proof = models.BooleanField(default=False)  # Resolution proof
    
    class Meta:
        verbose_name = _('Complaint Attachment')
        verbose_name_plural = _('Complaint Attachments')
    
    def __str__(self):
        return f"Attachment for {self.complaint.title}"


class ComplaintComment(models.Model):
    """Comments on complaints (chairman comments)"""
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_internal = models.BooleanField(default=False)  # Internal notes for officials
    
    class Meta:
        verbose_name = _('Complaint Comment')
        verbose_name_plural = _('Complaint Comments')
        ordering = ['created_at']
    
    def __str__(self):
        return f"Comment by {self.user.username} on {self.complaint.title}"


class ComplaintStatusHistory(models.Model):
    """Track status changes"""
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='status_history')
    old_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True)
    changed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        verbose_name = _('Complaint Status History')
        verbose_name_plural = _('Complaint Status Histories')
        ordering = ['-changed_at']
    
    def __str__(self):
        return f"{self.complaint.title}: {self.old_status} → {self.new_status}"

