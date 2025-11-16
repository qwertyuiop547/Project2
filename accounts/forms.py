"""
Accounts forms
"""
from django import forms
from django.contrib.auth.forms import UserCreationForm, PasswordChangeForm
from .models import CustomUser, ResidencyValidation


class UserRegistrationForm(UserCreationForm):
    """User registration form"""
    email = forms.EmailField(required=True)
    first_name = forms.CharField(required=True)
    last_name = forms.CharField(required=True)
    phone_number = forms.CharField(required=False)
    address = forms.CharField(widget=forms.Textarea, required=True)
    profile_photo = forms.ImageField(required=True)
    verification_document = forms.FileField(required=True)
    latitude = forms.DecimalField(required=False)
    longitude = forms.DecimalField(required=False)
    
    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'first_name', 'last_name', 'phone_number', 
                  'address', 'profile_photo', 'verification_document', 
                  'latitude', 'longitude', 'password1', 'password2']
    
    def clean_profile_photo(self):
        """Validate profile photo file size (max 15MB)"""
        photo = self.cleaned_data.get('profile_photo')
        if photo:
            if photo.size > 15 * 1024 * 1024:  # 15MB
                raise forms.ValidationError('Image size must be less than 15MB')
        return photo


class UserProfileForm(forms.ModelForm):
    """User profile update form"""
    class Meta:
        model = CustomUser
        fields = ['first_name', 'last_name', 'email', 'phone_number', 
                  'address', 'profile_photo', 'latitude', 'longitude']
    
    def clean_profile_photo(self):
        """Validate profile photo file size (max 15MB)"""
        photo = self.cleaned_data.get('profile_photo')
        if photo:
            if photo.size > 15 * 1024 * 1024:  # 15MB
                raise forms.ValidationError('Image size must be less than 15MB')
        return photo


class ChangePasswordForm(PasswordChangeForm):
    """Change password form"""
    pass


class UserApprovalForm(forms.Form):
    """User approval form"""
    rejection_reason = forms.CharField(widget=forms.Textarea, required=False)


class ResidencyValidationForm(forms.ModelForm):
    """Residency validation form"""
    class Meta:
        model = ResidencyValidation
        fields = ['validation_status', 'validation_notes', 
                  'address_verified', 'documents_verified', 'location_verified']

