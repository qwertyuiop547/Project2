"""
Notifications app URLs
"""
from django.urls import path
from . import views

app_name = 'notifications'

urlpatterns = [
    # Inbox
    path('', views.notification_list, name='notification_list'),
    path('<int:pk>/', views.notification_detail, name='notification_detail'),
    
    # Actions
    path('<int:pk>/read/', views.mark_notification_read, name='mark_notification_read'),
    path('mark-all-read/', views.mark_all_notifications_read, name='mark_all_notifications_read'),
    path('<int:pk>/delete/', views.delete_notification, name='delete_notification'),
    path('delete-all/', views.delete_all_notifications, name='delete_all_notifications'),
    path('delete-selected/', views.delete_selected_notifications, name='delete_selected_notifications'),
    
    # Preferences
    path('preferences/', views.notification_preferences, name='notification_preferences'),
    
    # APIs
    path('api/unread-count/', views.get_unread_notifications_count, name='get_unread_notifications_count'),
    path('api/recent/', views.get_recent_notifications, name='get_recent_notifications'),
]

