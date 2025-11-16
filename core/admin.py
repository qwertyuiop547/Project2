"""
Custom admin configuration
"""
from django.contrib import admin
from django.contrib.admin import AdminSite


class CustomAdminSite(AdminSite):
    site_header = 'Residents Management System'
    site_title = 'RMS Admin Portal'
    index_title = 'Welcome to Residents Management System'

