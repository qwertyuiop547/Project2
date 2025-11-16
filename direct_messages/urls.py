"""
Direct Messages URLs
"""
from django.urls import path
from . import views

app_name = 'direct_messages'

urlpatterns = [
    path('', views.inbox_view, name='inbox'),
    path('sent/', views.sent_messages_view, name='sent'),
    path('compose/', views.compose_message_view, name='compose'),
    path('<int:pk>/', views.message_detail_view, name='detail'),
    path('<int:pk>/delete/', views.delete_message_view, name='delete'),
    path('api/unread-count/', views.unread_count_api, name='unread_count'),
]
