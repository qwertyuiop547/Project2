"""
Gallery forms
"""
from django import forms

from .models import Photo, PhotoComment, PhotoCategory


class PhotoUploadForm(forms.ModelForm):
    """Photo upload form"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Ensure there are some default categories available so the dropdown is never empty.
        default_category_names = [
            'General',
            'Events',
            'Programs',
            'Services',
            'Community',
            'Infrastructure',
            'Others',
        ]
        for name in default_category_names:
            PhotoCategory.objects.get_or_create(name=name)

        # Configure category field queryset and label
        if 'category' in self.fields:
            self.fields['category'].queryset = PhotoCategory.objects.all().order_by('name')
            self.fields['category'].empty_label = 'Select category (optional)'

    class Meta:
        model = Photo
        # Allow user to optionally choose a category; view still sets a sensible
        # default if none is provided.
        fields = ['title', 'description', 'image', 'category']
        widgets = {
            'title': forms.TextInput(
                attrs={
                    'class': 'form-control',
                    'placeholder': 'Enter a short, clear title',
                }
            ),
            'description': forms.Textarea(
                attrs={
                    'class': 'form-control',
                    'rows': 3,
                    'placeholder': 'Describe the photo (event, date, location, etc.)',
                }
            ),
            'image': forms.ClearableFileInput(
                attrs={
                    'class': 'form-control',
                }
            ),
            'category': forms.Select(
                attrs={
                    'class': 'form-select',
                }
            ),
        }


class PhotoCommentForm(forms.ModelForm):
    """Photo comment form"""

    class Meta:
        model = PhotoComment
        fields = ['comment']
        widgets = {
            'comment': forms.Textarea(
                attrs={
                    'rows': 2,
                    'placeholder': 'Add a comment...',
                    # Match global dark theme input styling and allow extra tweaks via CSS
                    'class': 'form-control comment-input',
                }
            ),
        }


