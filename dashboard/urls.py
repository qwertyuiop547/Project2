"""
Dashboard app URLs
"""
from django.urls import path
from . import views

app_name = 'dashboard'

urlpatterns = [
    path('', views.dashboard_home, name='home'),
    path('resident/', views.resident_dashboard, name='resident'),
    path('secretary/', views.secretary_dashboard, name='secretary'),
    path('chairman/', views.chairman_dashboard, name='chairman'),
    path('reports/', views.reports_view, name='reports'),
]

