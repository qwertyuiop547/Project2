"""
Accounts app URLs
"""
from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    # Auth
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    
    # Profile
    path('profile/', views.profile_view, name='profile'),
    path('change-password/', views.change_password_view, name='change_password'),
    path('delete-account/', views.delete_account_confirm, name='delete_account_confirm'),
    path('delete-account/confirm/', views.delete_own_account, name='delete_own_account'),
    
    # Approval workflow
    path('wait-approval/', views.wait_approval_view, name='wait_approval'),
    path('approval/list/', views.user_approval_list, name='user_approval_list'),
    path('approval/approve/<int:user_id>/', views.approve_user, name='approve_user'),
    path('approval/reject/<int:user_id>/', views.reject_user, name='reject_user'),
    path('approval/documents/<int:user_id>/', views.view_user_documents, name='view_user_documents'),
    path('approval/document/<int:user_id>/', views.view_single_document, name='view_single_document'),
    path('approval/profile/<int:user_id>/', views.view_user_profile, name='view_user_profile'),
    
    # User management (Chairman)
    path('management/', views.user_management_list, name='user_management_list'),
    path('management/deactivate/<int:user_id>/', views.deactivate_user, name='deactivate_user'),
    path('management/activate/<int:user_id>/', views.activate_user, name='activate_user'),
    path('management/delete/<int:user_id>/', views.delete_user_account, name='delete_user_account'),
    
    # Residents map
    path('residents-map/', views.residents_map_view, name='residents_map'),
    
    # Residency validation (AJAX)
    path('api/validate-residency/', views.validate_residency, name='validate_residency'),
    path('api/validation-status/', views.get_validation_status, name='get_validation_status'),
    
    # Login history
    path('login-history/', views.login_history_view, name='login_history'),
    path('login-history/<int:user_id>/', views.user_login_history_view, name='user_login_history'),
    path('login-history/mark-suspicious/<int:session_id>/', views.mark_session_suspicious, name='mark_session_suspicious'),
    path('login-history/terminate/<int:user_id>/', views.terminate_user_sessions, name='terminate_user_sessions'),
]

