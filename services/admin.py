"""
Services admin
"""
from django.contrib import admin
from .models import ServiceCategory, Service, ServiceRequest


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon']
    search_fields = ['name']


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'is_active']
    list_filter = ['is_active', 'category']
    search_fields = ['name', 'description']


@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = ['reference_number', 'service', 'user', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['reference_number', 'user__username', 'service__name']
    readonly_fields = ['reference_number', 'created_at', 'updated_at', 'completed_at']

