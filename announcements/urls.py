"""
Announcements app URLs
"""
from django.urls import path
from . import views

app_name = 'announcements'

urlpatterns = [
    # Public
    path('', views.announcement_list, name='announcement_list'),
    path('<int:pk>/', views.announcement_detail, name='announcement_detail'),
    
    # Officials
    path('create/', views.create_announcement, name='create_announcement'),
    path('<int:pk>/edit/', views.edit_announcement, name='edit_announcement'),
    path('manage/', views.manage_announcements, name='manage_announcements'),
    
    # Approval workflow
    path('pending/', views.pending_approvals, name='pending_approvals'),
    path('<int:pk>/approve/', views.approve_announcement, name='approve_announcement'),
    path('<int:pk>/reject/', views.reject_announcement, name='reject_announcement'),
    path('<int:pk>/delete/', views.delete_announcement, name='delete_announcement'),
    
    # Notifications
    path('notifications/', views.my_notifications, name='my_notifications'),
]

