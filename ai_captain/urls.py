"""
AI Virtual Barangay Captain URLs
"""
from django.urls import path
from . import views

app_name = 'ai_captain'

urlpatterns = [
    # Main chat interface
    path('', views.captain_chat_view, name='chat'),
    
    # API endpoints
    path('api/start/', views.start_conversation_api, name='start_conversation'),
    path('api/chat/', views.chat_api, name='chat_api'),
    path('api/end/', views.end_conversation_api, name='end_conversation'),
    path('api/feedback/', views.message_feedback_api, name='message_feedback'),
    
    # Management
    path('manage/policies/', views.policy_management, name='policy_management'),
    path('manage/analytics/', views.conversation_analytics, name='analytics'),
]

