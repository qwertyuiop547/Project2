"""
Feedback admin
"""
from django.contrib import admin
from .models import Feedback


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ['subject', 'user', 'rating', 'is_reviewed', 'created_at']
    list_filter = ['rating', 'is_reviewed', 'created_at']
    search_fields = ['subject', 'message', 'user__username']
    readonly_fields = ['created_at', 'updated_at', 'reviewed_at']

