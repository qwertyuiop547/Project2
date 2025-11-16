"""
Analytics app URLs
"""
from django.urls import path
from . import views

app_name = 'analytics'

urlpatterns = [
    path('', views.analytics_overview, name='analytics_overview'),
    path('complaints/', views.analytics_complaints, name='analytics_complaints'),
    path('feedback/', views.analytics_feedback, name='analytics_feedback'),
    path('export/', views.analytics_export, name='analytics_export'),
]

