"""
Gallery admin
"""
from django.contrib import admin
from .models import PhotoCategory, Photo, PhotoLike, PhotoComment


@admin.register(PhotoCategory)
class PhotoCategoryAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']


@admin.register(Photo)
class PhotoAdmin(admin.ModelAdmin):
    list_display = ['title', 'uploaded_by', 'category', 'status', 'is_featured', 'view_count', 'like_count']
    list_filter = ['status', 'is_featured', 'category', 'uploaded_at']
    search_fields = ['title', 'description']
    readonly_fields = ['uploaded_at', 'approved_at', 'view_count', 'like_count']


@admin.register(PhotoLike)
class PhotoLikeAdmin(admin.ModelAdmin):
    list_display = ['photo', 'user', 'created_at']
    list_filter = ['created_at']
    search_fields = ['photo__title', 'user__username']


@admin.register(PhotoComment)
class PhotoCommentAdmin(admin.ModelAdmin):
    list_display = ['photo', 'user', 'created_at']
    list_filter = ['created_at']
    search_fields = ['photo__title', 'user__username', 'comment']

