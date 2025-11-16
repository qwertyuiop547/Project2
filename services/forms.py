"""
Services forms
"""
from django import forms
from .models import ServiceRequest


class ServiceRequestForm(forms.ModelForm):
    """Service request form"""
    class Meta:
        model = ServiceRequest
        fields = ['details']
        widgets = {
            'details': forms.Textarea(attrs={'rows': 5, 'placeholder': 'Provide details about your request...'}),
        }

