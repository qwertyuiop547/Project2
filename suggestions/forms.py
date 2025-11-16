"""
Suggestions forms
"""
from django import forms
from .models import Suggestion


class SuggestionForm(forms.ModelForm):
    """Suggestion submission form"""
    class Meta:
        model = Suggestion
        fields = ['title', 'description']
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Give your suggestion a clear and descriptive title...'
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 6,
                'placeholder': 'Describe your suggestion in detail. Explain what you want to improve, why it matters, and how it will benefit the community...'
            }),
        }

