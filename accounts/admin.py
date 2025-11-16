"""
Accounts admin
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, LoginHistory, ResidencyValidation


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'role', 'is_approved', 'is_deactivated']
    list_filter = ['role', 'is_approved', 'is_deactivated', 'is_staff']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Fields', {'fields': (
            'role', 'phone_number', 'address', 'profile_photo', 'verification_document',
            'is_approved', 'approval_date', 'approved_by', 'rejection_reason',
            'latitude', 'longitude', 'residency_validation_score', 'residency_validation_status',
            'is_deactivated', 'deactivated_date'
        )}),
    )


@admin.register(LoginHistory)
class LoginHistoryAdmin(admin.ModelAdmin):
    list_display = ['user', 'login_time', 'logout_time', 'ip_address', 'is_suspicious', 'is_active']
    list_filter = ['is_suspicious', 'is_active', 'login_time']
    search_fields = ['user__username', 'ip_address']
    readonly_fields = ['login_time', 'logout_time']


@admin.register(ResidencyValidation)
class ResidencyValidationAdmin(admin.ModelAdmin):
    list_display = ['user', 'validation_status', 'validation_score', 'validation_date']
    list_filter = ['validation_status', 'address_verified', 'documents_verified', 'location_verified']
    search_fields = ['user__username']

