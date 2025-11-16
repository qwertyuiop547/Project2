"""
Complaints forms
"""
from django import forms
from .models import Complaint, ComplaintComment


class ComplaintForm(forms.ModelForm):
    """Complaint creation form"""
    class Meta:
        model = Complaint
        # Residents only provide basic details; priority is set later by secretary.
        fields = ['title', 'description', 'category']
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Enter a clear and concise title for your complaint...'
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 6,
                'placeholder': 'Describe your complaint in detail. Include what happened, when, where, and any other relevant information...'
            }),
            'category': forms.Select(attrs={
                'class': 'form-select',
            }),
        }


class ComplaintCommentForm(forms.ModelForm):
    """Complaint comment form"""
    class Meta:
        model = ComplaintComment
        fields = ['comment', 'is_internal']
        widgets = {
            'comment': forms.Textarea(
                attrs={
                    'rows': 3,
                    'class': 'form-control complaint-comment-input',
                    'placeholder': 'Add a clear, respectful comment or follow-up...',
                }
            ),
        }


class ComplaintRatingForm(forms.ModelForm):
    """Resident rating form for resolved complaints"""
    class Meta:
        model = Complaint
        fields = ['rating', 'rating_feedback']
        widgets = {
            'rating': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': 1,
                'max': 5,
            }),
            'rating_feedback': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Optional: Share a short feedback about how your complaint was handled...',
            }),
        }
