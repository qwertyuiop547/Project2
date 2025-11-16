"""
Suggestions app URLs
"""
from django.urls import path
from . import views

app_name = 'suggestions'

urlpatterns = [
    # Public
    path('', views.suggestion_list, name='suggestion_list'),
    path('<int:pk>/', views.suggestion_detail, name='suggestion_detail'),
    path('submit/', views.submit_suggestion, name='submit_suggestion'),
    path('my-suggestions/', views.my_suggestions, name='my_suggestions'),
    
    # AJAX
    path('api/vote/', views.vote_suggestion, name='vote_suggestion'),
    
    # Officials
    path('manage/', views.manage_suggestions, name='manage_suggestions'),
    path('<int:pk>/review/', views.review_suggestion, name='review_suggestion'),
    path('<int:pk>/approve/', views.approve_suggestion, name='approve_suggestion'),
    path('<int:pk>/reject/', views.reject_suggestion, name='reject_suggestion'),
]

