"""
Feedback app URLs
"""
from django.urls import path
from . import views

app_name = 'feedback'

urlpatterns = [
    path('', views.feedback_list, name='feedback_list'),
    path('submit/', views.submit_feedback, name='submit_feedback'),
    path('<int:pk>/', views.feedback_detail, name='feedback_detail'),
    path('statistics/', views.feedback_statistics, name='feedback_statistics'),
    path('api/statistics/', views.feedback_statistics_api, name='feedback_statistics_api'),
]

