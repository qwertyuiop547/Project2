"""
Announcements forms
"""
from django import forms
from .models import Announcement


class AnnouncementForm(forms.ModelForm):
    """Announcement form"""

    class Meta:
        model = Announcement
        # Priority is managed internally (default 'normal'), not editable in the form
        fields = ['title', 'category', 'content', 'image', 'expiry_date']
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'form-control announcement-input',
            }),
            'category': forms.Select(attrs={
                'class': 'form-select announcement-select',
            }),
            'content': forms.Textarea(attrs={
                'rows': 10,
                'class': 'form-control announcement-textarea',
            }),
            'image': forms.ClearableFileInput(attrs={
                'class': 'form-control announcement-file-input',
            }),
            'expiry_date': forms.DateTimeInput(attrs={
                'type': 'datetime-local',
                'class': 'form-control announcement-input',
            }),
        }

