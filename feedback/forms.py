"""
Feedback forms
"""
from django import forms
from .models import Feedback


class FeedbackForm(forms.ModelForm):
    """Feedback submission form"""
    class Meta:
        model = Feedback
        fields = ['subject', 'message', 'rating', 'attachment']
        widgets = {
            'message': forms.Textarea(attrs={'rows': 5}),
        }

