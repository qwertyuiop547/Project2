"""
Services app URLs
"""
from django.urls import path
from . import views

app_name = 'services'

urlpatterns = [
    # Catalog
    path('', views.service_list, name='service_list'),
    path('<int:pk>/', views.service_detail, name='service_detail'),
    
    # Requests
    path('<int:service_id>/request/', views.service_request_create, name='service_request_create'),
    path('requests/', views.service_request_list, name='service_request_list'),
    path('requests/<int:pk>/', views.service_request_detail, name='service_request_detail'),
]

