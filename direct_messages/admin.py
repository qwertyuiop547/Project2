"""
Direct Messages admin configuration
"""
from django.contrib import admin
from .models import DirectMessage


@admin.register(DirectMessage)
class DirectMessageAdmin(admin.ModelAdmin):
    list_display = ['subject', 'sender', 'recipient', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['subject', 'message', 'sender__username', 'recipient__username']
    readonly_fields = ['created_at', 'read_at']
    
    fieldsets = (
        ('Message Info', {
            'fields': ('sender', 'recipient', 'subject', 'message', 'parent_message')
        }),
        ('Status', {
            'fields': ('is_read', 'created_at', 'read_at')
        }),
    )
