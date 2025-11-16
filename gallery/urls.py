"""
Gallery app URLs
"""
from django.urls import path
from . import views

app_name = 'gallery'

urlpatterns = [
    # Public
    path('', views.gallery_list, name='gallery_list'),
    path('<int:pk>/', views.photo_detail, name='photo_detail'),
    path('category/<int:category_id>/', views.category_photos, name='category_photos'),
    
    # User actions
    path('upload/', views.upload_photo, name='upload_photo'),
    path('my-photos/', views.my_photos, name='my_photos'),
    
    # AJAX
    path('api/like/', views.like_photo, name='like_photo'),
    path('api/comment/', views.add_comment, name='add_comment'),
    
    # Officials
    path('manage/', views.manage_gallery, name='manage_gallery'),
    path('<int:pk>/approve/', views.approve_photo, name='approve_photo'),
    path('<int:pk>/reject/', views.reject_photo, name='reject_photo'),
    path('<int:pk>/feature/', views.feature_photo, name='feature_photo'),
    path('<int:pk>/delete/', views.delete_photo, name='delete_photo'),
]

