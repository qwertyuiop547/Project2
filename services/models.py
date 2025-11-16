"""
Services models
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from accounts.models import CustomUser


class ServiceCategory(models.Model):
    """Service categories"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)
    
    class Meta:
        verbose_name = _('Service Category')
        verbose_name_plural = _('Service Categories')
    
    def __str__(self):
        return self.name


class Service(models.Model):
    """Available services"""
    name = models.CharField(max_length=255)
    description = models.TextField()
    category = models.ForeignKey(ServiceCategory, on_delete=models.SET_NULL, null=True, related_name='services')
    is_active = models.BooleanField(default=True)
    icon = models.CharField(max_length=50, blank=True)
    
    # Requirements
    requirements = models.TextField(blank=True, help_text="Required documents or information")
    processing_time = models.CharField(max_length=100, blank=True, help_text="Expected processing time")
    
    class Meta:
        verbose_name = _('Service')
        verbose_name_plural = _('Services')
    
    def __str__(self):
        return self.name


class ServiceRequest(models.Model):
    """Service requests from users"""
    
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('in_progress', _('In Progress')),
        ('completed', _('Completed')),
        ('rejected', _('Rejected')),
        ('cancelled', _('Cancelled')),
    ]
    
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='requests')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='service_requests')
    reference_number = models.CharField(max_length=20, unique=True, blank=True)
    
    # Request details
    details = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Staff notes
    staff_notes = models.TextField(blank=True)
    handled_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='handled_service_requests')
    
    class Meta:
        verbose_name = _('Service Request')
        verbose_name_plural = _('Service Requests')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.reference_number} - {self.service.name}"
    
    def save(self, *args, **kwargs):
        # Generate reference number
        if not self.reference_number:
            import random
            import string
            self.reference_number = 'SR-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        super().save(*args, **kwargs)

