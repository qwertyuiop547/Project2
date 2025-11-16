"""
Complaints app URLs
"""
from django.urls import path
from . import views

app_name = 'complaints'

urlpatterns = [
    # Complaint management
    path('', views.complaint_list, name='complaint_list'),
    path('create/', views.create_complaint, name='create_complaint'),
    path('<int:pk>/', views.complaint_detail, name='complaint_detail'),
    path('<int:pk>/update/', views.update_complaint, name='update_complaint'),
    path('<int:pk>/accept/', views.accept_complaint, name='accept_complaint'),
    path('<int:pk>/priority/', views.update_priority, name='update_priority'),
    path('<int:pk>/resolve/', views.mark_resolved, name='mark_resolved'),
    path('<int:pk>/close/', views.close_complaint, name='close_complaint'),
    path('<int:pk>/delete/', views.delete_complaint, name='delete_complaint'),
    
    # Attachments
    path('attachment/<int:attachment_id>/delete/', views.delete_attachment, name='delete_attachment'),
    
    # APIs
    path('api/statistics/', views.complaint_statistics_api, name='complaint_statistics_api'),
    path('api/tracking/<int:pk>/', views.complaint_tracking_api, name='complaint_tracking_api'),
    
    # Anonymous
    path('anonymous-success/', views.anonymous_success, name='anonymous_success'),
]

