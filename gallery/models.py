"""
Gallery models
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from accounts.models import CustomUser


class PhotoCategory(models.Model):
    """Categories for gallery photos"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    
    class Meta:
        verbose_name = _('Photo Category')
        verbose_name_plural = _('Photo Categories')
    
    def __str__(self):
        return self.name


class Photo(models.Model):
    """Gallery photos"""
    
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('approved', _('Approved')),
        ('rejected', _('Rejected')),
    ]
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='gallery/')
    category = models.ForeignKey(PhotoCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='photos')
    
    # User info
    uploaded_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='uploaded_photos')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    # Approval
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='approved')  # Auto-approve
    approved_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_photos')
    approved_at = models.DateTimeField(null=True, blank=True)
    
    # Featured
    is_featured = models.BooleanField(default=False)
    
    # Engagement
    view_count = models.IntegerField(default=0)
    like_count = models.IntegerField(default=0)
    
    class Meta:
        verbose_name = _('Photo')
        verbose_name_plural = _('Photos')
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return self.title


class PhotoLike(models.Model):
    """Track photo likes"""
    photo = models.ForeignKey(Photo, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='photo_likes')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('Photo Like')
        verbose_name_plural = _('Photo Likes')
        unique_together = ['photo', 'user']
    
    def __str__(self):
        return f"{self.user.username} likes {self.photo.title}"


class PhotoComment(models.Model):
    """Comments on photos"""
    photo = models.ForeignKey(Photo, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='photo_comments')
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('Photo Comment')
        verbose_name_plural = _('Photo Comments')
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.user.username} on {self.photo.title}"

