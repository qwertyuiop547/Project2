"""
Accounts app views
"""
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse, HttpResponse
from django.utils.translation import gettext as _
from django.utils import timezone
from django.db.models import Q, Count
from django.core.paginator import Paginator
from .models import CustomUser, LoginHistory, ResidencyValidation
from .forms import (
    UserRegistrationForm, UserProfileForm, ChangePasswordForm,
    UserApprovalForm, ResidencyValidationForm
)
import random


def register_view(request):
    """User registration with profile photo and verification document"""
    if request.method == 'POST':
        form = UserRegistrationForm(request.POST, request.FILES)
        if form.is_valid():
            user = form.save(commit=False)
            user.is_approved = False
            user.is_active = True  # Can login but limited access
            user.save()
            
            messages.success(request, _('Registration successful! Your account is pending approval.'))
            return redirect('accounts:wait_approval')
    else:
        form = UserRegistrationForm()
    
    return render(request, 'accounts/register.html', {'form': form})


def login_view(request):
    """User login"""
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            if user.is_deactivated:
                messages.error(request, _('Your account has been deactivated.'))
            else:
                login(request, user)
                
                # Create login history
                LoginHistory.objects.create(
                    user=user,
                    ip_address=request.META.get('REMOTE_ADDR', '0.0.0.0'),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')[:255],
                    session_key=request.session.session_key or '',
                )
                
                messages.success(request, _('Welcome back, {}!').format(user.username))
                return redirect('dashboard:home')
        else:
            messages.error(request, _('Invalid username or password.'))
    
    return render(request, 'accounts/login.html')


def logout_view(request):
    """User logout"""
    # Update logout time in login history
    if request.user.is_authenticated:
        LoginHistory.objects.filter(
            user=request.user,
            session_key=request.session.session_key,
            is_active=True
        ).update(logout_time=timezone.now(), is_active=False)
    
    logout(request)
    messages.success(request, _('You have been logged out successfully.'))
    return redirect('home:index')


@login_required
def profile_view(request):
    """View and update user profile"""
    if request.method == 'POST':
        # Check if it's an AJAX request for photo upload
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            if 'profile_photo' in request.FILES:
                photo = request.FILES['profile_photo']
                
                # Validate file size (max 15MB)
                if photo.size > 15 * 1024 * 1024:
                    return JsonResponse({
                        'success': False,
                        'error': _('Image size must be less than 15MB')
                    }, status=400)
                
                # Validate file type
                if not photo.content_type.startswith('image/'):
                    return JsonResponse({
                        'success': False,
                        'error': _('Please upload an image file')
                    }, status=400)
                
                user = request.user
                user.profile_photo = photo
                user.save()
                
                # Important: Update session auth hash to prevent logout
                update_session_auth_hash(request, user)
                
                return JsonResponse({
                    'success': True,
                    'photo_url': user.profile_photo.url,
                    'message': _('Profile photo updated successfully!')
                })
            else:
                return JsonResponse({
                    'success': False,
                    'error': _('No photo file provided')
                }, status=400)
        
        # Regular form submission
        form = UserProfileForm(request.POST, request.FILES, instance=request.user)
        if form.is_valid():
            user = form.save()
            # Important: Update session auth hash to prevent logout when user is updated
            update_session_auth_hash(request, user)
            messages.success(request, _('Profile updated successfully!'))
            return redirect('accounts:profile')
    else:
        form = UserProfileForm(instance=request.user)
    
    return render(request, 'accounts/profile.html', {'form': form})


@login_required
def change_password_view(request):
    """Change password"""
    if request.method == 'POST':
        form = ChangePasswordForm(request.user, request.POST)
        if form.is_valid():
            user = form.save()
            update_session_auth_hash(request, user)
            messages.success(request, _('Your password was successfully updated!'))
            return redirect('accounts:profile')
    else:
        form = ChangePasswordForm(request.user)
    
    return render(request, 'accounts/change_password.html', {'form': form})


@login_required
def delete_account_confirm(request):
    """Confirm account deletion"""
    return render(request, 'accounts/delete_account_confirm.html')


@login_required
def delete_own_account(request):
    """Delete own account"""
    if request.method == 'POST':
        user = request.user
        logout(request)
        user.delete()
        messages.success(request, _('Your account has been deleted.'))
        return redirect('home:index')
    return redirect('accounts:delete_account_confirm')


@login_required
def wait_approval_view(request):
    """Waiting for approval page"""
    if request.user.is_approved:
        return redirect('dashboard:home')
    
    return render(request, 'accounts/wait_approval.html')


@login_required
def user_approval_list(request):
    """List of pending users (Chairman/Secretary only)"""
    if not request.user.is_official():
        messages.error(request, _('Access denied.'))
        return redirect('dashboard:home')
    
    pending_users = CustomUser.objects.filter(is_approved=False).annotate(
        complaints_count=Count('complaints')
    )
    
    # Statistics
    total_pending = pending_users.count()
    total_approved = CustomUser.objects.filter(is_approved=True).count()
    
    context = {
        'pending_users': pending_users,
        'total_pending': total_pending,
        'total_approved': total_approved,
    }
    
    return render(request, 'accounts/user_approval_list.html', context)


@login_required
def approve_user(request, user_id):
    """Approve a user (Chairman/Secretary only)"""
    if not request.user.is_official():
        messages.error(request, _('Access denied.'))
        return redirect('dashboard:home')
    
    user = get_object_or_404(CustomUser, id=user_id)
    user.is_approved = True
    user.approval_date = timezone.now()
    user.approved_by = request.user
    user.save()
    
    messages.success(request, _('User {} has been approved.').format(user.username))
    return redirect('accounts:user_approval_list')


@login_required
def reject_user(request, user_id):
    """Reject a user (Chairman/Secretary only)"""
    if not request.user.is_official():
        messages.error(request, _('Access denied.'))
        return redirect('dashboard:home')
    
    if request.method == 'POST':
        user = get_object_or_404(CustomUser, id=user_id)
        user.rejection_reason = request.POST.get('reason', '')
        user.is_active = False
        user.save()
        
        messages.success(request, _('User {} has been rejected.').format(user.username))
        return redirect('accounts:user_approval_list')
    
    return redirect('accounts:user_approval_list')


@login_required
def view_user_documents(request, user_id):
    """View user's verification documents"""
    if not request.user.is_official():
        messages.error(request, _('Access denied.'))
        return redirect('dashboard:home')
    
    user = get_object_or_404(CustomUser, id=user_id)
    return render(request, 'accounts/view_user_documents.html', {'viewed_user': user})


@login_required
def view_single_document(request, user_id):
    """View a single document"""
    if not request.user.is_official():
        messages.error(request, _('Access denied.'))
        return redirect('dashboard:home')
    
    user = get_object_or_404(CustomUser, id=user_id)
    
    if user.verification_document:
        # Serve the file
        return HttpResponse(user.verification_document.read(), content_type='application/pdf')
    
    messages.error(request, _('Document not found.'))
    return redirect('accounts:view_user_documents', user_id=user_id)


@login_required
def view_user_profile(request, user_id):
    """View another user's profile (officials only)"""
    if not request.user.is_official():
        messages.error(request, _('Access denied.'))
        return redirect('dashboard:home')
    
    user = get_object_or_404(CustomUser, id=user_id)
    return render(request, 'accounts/view_user_profile.html', {'viewed_user': user})


@login_required
def user_management_list(request):
    """Residents list with search/filters (Chairman only)"""
    if not request.user.is_chairman():
        messages.error(request, _('Access denied.'))
        return redirect('dashboard:home')
    
    users = CustomUser.objects.filter(is_approved=True)
    
    # Search
    search = request.GET.get('search', '')
    if search:
        users = users.filter(
            Q(username__icontains=search) |
            Q(email__icontains=search) |
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search)
        )
    
    # Role filter
    role = request.GET.get('role', '')
    if role:
        users = users.filter(role=role)
    
    # Statistics
    total_residents = users.filter(role='resident').count()
    total_officials = users.filter(role__in=['secretary', 'chairman']).count()
    active_users = users.filter(is_deactivated=False).count()
    
    # Pagination
    paginator = Paginator(users, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'search': search,
        'role': role,
        'total_residents': total_residents,
        'total_officials': total_officials,
        'active_users': active_users,
    }
    
    return render(request, 'accounts/user_management_list.html', context)


@login_required
def deactivate_user(request, user_id):
    """Deactivate a user (Chairman only)"""
    if not request.user.is_chairman():
        messages.error(request, _('Access denied.'))
        return redirect('dashboard:home')
    
    user = get_object_or_404(CustomUser, id=user_id)
    
    if user == request.user:
        messages.error(request, _('You cannot deactivate your own account.'))
        return redirect('accounts:user_management_list')
    
    user.is_deactivated = True
    user.deactivated_date = timezone.now()
    user.save()
    
    messages.success(request, _('User {} has been deactivated.').format(user.username))
    return redirect('accounts:user_management_list')


@login_required
def activate_user(request, user_id):
    """Activate a user (Chairman only)"""
    if not request.user.is_chairman():
        messages.error(request, _('Access denied.'))
        return redirect('dashboard:home')
    
    user = get_object_or_404(CustomUser, id=user_id)
    user.is_deactivated = False
    user.deactivated_date = None
    user.save()
    
    messages.success(request, _('User {} has been activated.').format(user.username))
    return redirect('accounts:user_management_list')


@login_required
def delete_user_account(request, user_id):
    """Delete a user account (Chairman only)"""
    if not request.user.is_chairman():
        messages.error(request, _('Access denied.'))
        return redirect('dashboard:home')
    
    user = get_object_or_404(CustomUser, id=user_id)
    
    if user == request.user:
        messages.error(request, _('You cannot delete your own account.'))
        return redirect('accounts:user_management_list')
    
    if request.method == 'POST':
        username = user.username
        user.delete()
        messages.success(request, _('User {} has been deleted.').format(username))
        return redirect('accounts:user_management_list')
    
    return render(request, 'accounts/delete_user_confirm.html', {'viewed_user': user})


@login_required
def residents_map_view(request):
    """Map of approved residents with coordinates"""
    residents = CustomUser.objects.filter(
        is_approved=True,
        role='resident',
        latitude__isnull=False,
        longitude__isnull=False
    ).values('id', 'username', 'latitude', 'longitude', 'address')
    
    context = {
        'residents': list(residents),
    }
    
    return render(request, 'accounts/residents_map.html', context)


@login_required
def validate_residency(request):
    """AJAX: Run residency validation"""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=400)
    
    user_id = request.POST.get('user_id')
    user = get_object_or_404(CustomUser, id=user_id)
    
    # Simple validation logic (can be enhanced)
    score = 0
    status = 'pending'
    notes = []
    
    if user.address:
        score += 30
    if user.verification_document:
        score += 40
    if user.latitude and user.longitude:
        score += 30
    
    if score >= 70:
        status = 'verified'
        notes.append('All requirements met')
    elif score >= 50:
        status = 'partial'
        notes.append('Some information missing')
    else:
        status = 'failed'
        notes.append('Insufficient information')
    
    # Save validation
    validation, created = ResidencyValidation.objects.get_or_create(user=user)
    validation.validation_score = score
    validation.validation_status = status
    validation.validation_notes = '\n'.join(notes)
    validation.validated_by = request.user
    validation.address_verified = bool(user.address)
    validation.documents_verified = bool(user.verification_document)
    validation.location_verified = bool(user.latitude and user.longitude)
    validation.save()
    
    return JsonResponse({
        'score': score,
        'status': status,
        'notes': notes,
    })


@login_required
def get_validation_status(request):
    """AJAX: Get current validation status"""
    user_id = request.GET.get('user_id')
    user = get_object_or_404(CustomUser, id=user_id)
    
    try:
        validation = user.validation
        data = {
            'score': validation.validation_score,
            'status': validation.validation_status,
            'notes': validation.validation_notes,
            'address_verified': validation.address_verified,
            'documents_verified': validation.documents_verified,
            'location_verified': validation.location_verified,
        }
    except ResidencyValidation.DoesNotExist:
        data = {
            'score': 0,
            'status': 'pending',
            'notes': 'Not validated yet',
        }
    
    return JsonResponse(data)


@login_required
def login_history_view(request):
    """View own login history"""
    history = LoginHistory.objects.filter(user=request.user)[:20]
    return render(request, 'accounts/login_history.html', {'history': history})


@login_required
def user_login_history_view(request, user_id):
    """View user's login history (Chairman only)"""
    if not request.user.is_chairman():
        messages.error(request, _('Access denied.'))
        return redirect('dashboard:home')
    
    user = get_object_or_404(CustomUser, id=user_id)
    history = LoginHistory.objects.filter(user=user)[:20]
    
    return render(request, 'accounts/user_login_history.html', {
        'viewed_user': user,
        'history': history,
    })


@login_required
def mark_session_suspicious(request, session_id):
    """Mark a session as suspicious (Chairman only)"""
    if not request.user.is_chairman():
        messages.error(request, _('Access denied.'))
        return redirect('dashboard:home')
    
    session = get_object_or_404(LoginHistory, id=session_id)
    session.is_suspicious = True
    session.save()
    
    messages.success(request, _('Session marked as suspicious.'))
    return redirect('accounts:user_login_history', user_id=session.user.id)


@login_required
def terminate_user_sessions(request, user_id):
    """Terminate all active sessions for a user (Chairman only)"""
    if not request.user.is_chairman():
        messages.error(request, _('Access denied.'))
        return redirect('dashboard:home')
    
    user = get_object_or_404(CustomUser, id=user_id)
    
    LoginHistory.objects.filter(user=user, is_active=True).update(
        is_active=False,
        logout_time=timezone.now()
    )
    
    messages.success(request, _('All sessions for {} have been terminated.').format(user.username))
    return redirect('accounts:user_login_history', user_id=user_id)

