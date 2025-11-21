"""
Suggestions models
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from accounts.models import CustomUser


class Suggestion(models.Model):
    """User suggestions"""
    
    STATUS_CHOICES = [
        ('pending', _('Pending Review')),
        ('under_review', _('Under Review')),
        ('approved', _('Approved')),
        ('rejected', _('Rejected')),
        ('implemented', _('Implemented')),
    ]
    
    CATEGORY_CHOICES = [
        ('infrastructure', _('Infrastructure')),
        ('services', _('Services')),
        ('programs', _('Programs')),
        ('safety', _('Safety')),
        ('environment', _('Environment')),
        ('other', _('Other')),
    ]
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='other')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='suggestions')
    
    # Privacy / anonymity
    is_anonymous = models.BooleanField(default=False)
    # Optional reference code so that truly anonymous suggestions can still be
    # tracked or referred to without exposing the user's identity.
    anonymous_reference = models.CharField(max_length=20, blank=True, null=True, unique=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Status
    # Suggestions are visible to all users immediately, but labeled as "pending" until officials review them.
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_suggestions')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True)
    
    # Voting
    vote_count = models.IntegerField(default=0)
    
    class Meta:
        verbose_name = _('Suggestion')
        verbose_name_plural = _('Suggestions')
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # Ensure non-anonymous suggestions don't keep any anonymous reference
        if not self.is_anonymous:
            self.anonymous_reference = None

        # Generate anonymous reference if needed
        if self.is_anonymous and not self.anonymous_reference:
            import random
            import string

            # Optimized: Add max attempts to prevent infinite loop
            max_attempts = 100
            attempts = 0
            while attempts < max_attempts:
                reference = ''.join(
                    random.choices(string.ascii_uppercase + string.digits, k=10)
                )
                if not Suggestion.objects.filter(anonymous_reference=reference).exists():
                    self.anonymous_reference = reference
                    break
                attempts += 1
            else:
                # Fallback: Use timestamp-based reference if all attempts fail
                import time
                self.anonymous_reference = f"REF{int(time.time())}{random.randint(1000, 9999)}"

        super().save(*args, **kwargs)


class SuggestionVote(models.Model):
    """Track suggestion votes"""
    suggestion = models.ForeignKey(Suggestion, on_delete=models.CASCADE, related_name='votes')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='suggestion_votes')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('Suggestion Vote')
        verbose_name_plural = _('Suggestion Votes')
        unique_together = ['suggestion', 'user']
    
    def __str__(self):
        return f"{self.user.username} votes for {self.suggestion.title}"

