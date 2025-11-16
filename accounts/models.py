"""
Accounts models
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class CustomUser(AbstractUser):
    """Custom user model with additional fields"""
    
    ROLE_CHOICES = [
        ('resident', _('Resident')),
        ('secretary', _('Secretary')),
        ('chairman', _('Chairman')),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='resident')
    phone_number = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    profile_photo = models.ImageField(upload_to='profile_photos/', blank=True, null=True)
    verification_document = models.FileField(upload_to='verification_docs/', blank=True, null=True)
    
    # Approval status
    is_approved = models.BooleanField(default=False)
    approval_date = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_users')
    rejection_reason = models.TextField(blank=True)
    
    # Residency validation
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    residency_validation_score = models.IntegerField(null=True, blank=True)
    residency_validation_status = models.CharField(max_length=20, blank=True)
    residency_validation_notes = models.TextField(blank=True)
    
    # Account status
    is_deactivated = models.BooleanField(default=False)
    deactivated_date = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = _('User')
        verbose_name_plural = _('Users')
        indexes = [
            models.Index(fields=['is_approved', 'role']),
            models.Index(fields=['is_approved', 'role', 'is_deactivated']),
        ]
    
    def __str__(self):
        return self.username
    
    def is_chairman(self):
        # Treat superusers as chairman-level officials
        return self.is_superuser or self.role == 'chairman'
    
    def is_secretary(self):
        return self.role == 'secretary'
    
    def is_resident(self):
        return self.role == 'resident'
    
    def is_official(self):
        # Officials are chairman/secretary, plus any superuser account
        return self.is_superuser or self.role in ['chairman', 'secretary']

    def can_view_anonymous_identity(self):
        """
        Which officials are allowed to see the real identity
        behind complaints/suggestions that were submitted as anonymous.

        For now we restrict this to chairman-level officials (including superusers).
        This keeps behavior configurable in one place and is easy to adjust later
        if the barangay decides to widen or restrict access.
        """
        return self.is_chairman()


class LoginHistory(models.Model):
    """Track user login history and sessions"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='login_history')
    login_time = models.DateTimeField(auto_now_add=True)
    logout_time = models.DateTimeField(null=True, blank=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    device_info = models.CharField(max_length=255, blank=True)
    session_key = models.CharField(max_length=40, blank=True)
    is_suspicious = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = _('Login History')
        verbose_name_plural = _('Login Histories')
        ordering = ['-login_time']
    
    def __str__(self):
        return f"{self.user.username} - {self.login_time}"


class ResidencyValidation(models.Model):
    """Store residency validation results"""
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='validation')
    validation_score = models.IntegerField(default=0)
    validation_status = models.CharField(max_length=20, default='pending')
    validation_notes = models.TextField(blank=True)
    validation_date = models.DateTimeField(auto_now=True)
    validated_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='validated_users')
    
    # Feedback from validation
    address_verified = models.BooleanField(default=False)
    documents_verified = models.BooleanField(default=False)
    location_verified = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = _('Residency Validation')
        verbose_name_plural = _('Residency Validations')
    
    def __str__(self):
        return f"{self.user.username} - {self.validation_status}"

