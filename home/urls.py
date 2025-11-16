"""
Home app URLs
"""
from django.urls import path
from . import views

app_name = 'home'

urlpatterns = [
    path('', views.index, name='index'),
    path('api/quick-stats/', views.quick_stats_api, name='quick_stats_api'),
    path('aurora-test/', views.aurora_test, name='aurora_test'),
]

