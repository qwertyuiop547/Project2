"""
Announcements admin
"""
from django.contrib import admin
from .models import Announcement, AnnouncementNotification


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ['title', 'status', 'priority', 'created_by', 'created_at', 'publish_date', 'view_count']
    list_filter = ['status', 'priority', 'created_at', 'publish_date']
    search_fields = ['title', 'content']
    readonly_fields = ['created_at', 'updated_at', 'approved_at', 'view_count']


@admin.register(AnnouncementNotification)
class AnnouncementNotificationAdmin(admin.ModelAdmin):
    list_display = ['announcement', 'user', 'sent_at', 'is_read']
    list_filter = ['is_read', 'sent_at']
    search_fields = ['announcement__title', 'user__username']
    readonly_fields = ['sent_at', 'read_at']

