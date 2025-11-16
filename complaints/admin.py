"""
Complaints admin
"""
from django.contrib import admin
from .models import (
    ComplaintCategory, Complaint, ComplaintAttachment,
    ComplaintComment, ComplaintStatusHistory
)


@admin.register(ComplaintCategory)
class ComplaintCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon']
    search_fields = ['name']


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ['title', 'status', 'priority', 'category', 'user', 'created_at', 'is_anonymous']
    list_filter = ['status', 'priority', 'category', 'is_anonymous', 'is_internal']
    search_fields = ['title', 'description', 'anonymous_reference']
    readonly_fields = ['created_at', 'updated_at', 'accepted_at', 'resolved_at', 'closed_at']


@admin.register(ComplaintAttachment)
class ComplaintAttachmentAdmin(admin.ModelAdmin):
    list_display = ['complaint', 'uploaded_by', 'uploaded_at', 'is_proof']
    list_filter = ['is_proof', 'uploaded_at']
    search_fields = ['complaint__title']


@admin.register(ComplaintComment)
class ComplaintCommentAdmin(admin.ModelAdmin):
    list_display = ['complaint', 'user', 'created_at', 'is_internal']
    list_filter = ['is_internal', 'created_at']
    search_fields = ['complaint__title', 'comment']


@admin.register(ComplaintStatusHistory)
class ComplaintStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ['complaint', 'old_status', 'new_status', 'changed_by', 'changed_at']
    list_filter = ['old_status', 'new_status', 'changed_at']
    search_fields = ['complaint__title']
    readonly_fields = ['changed_at']

