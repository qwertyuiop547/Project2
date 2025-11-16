"""
Direct Messages forms
"""
from django import forms
from .models import DirectMessage
from accounts.models import CustomUser
from django.utils.translation import gettext_lazy as _


class DirectMessageForm(forms.ModelForm):
    """Form for sending direct messages"""
    recipient = forms.ModelChoiceField(
        queryset=CustomUser.objects.none(),
        required=False,
        widget=forms.Select(attrs={
            'class': 'form-control',
        }),
        label=_('To'),
        help_text=_('Select recipient')
    )
    
    class Meta:
        model = DirectMessage
        fields = ['recipient', 'subject', 'message']
        widgets = {
            'subject': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Enter subject'),
            }),
            'message': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': _('Type your message here...'),
                'rows': 6,
            }),
        }
    
    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        
        if user and user.is_official():
            # Admins can send to any resident
            self.fields['recipient'].queryset = CustomUser.objects.filter(
                role='resident',
                is_approved=True
            ).order_by('first_name', 'last_name', 'username')
            self.fields['recipient'].required = True
        else:
            # Residents send to admin (hidden field)
            self.fields['recipient'].widget = forms.HiddenInput()
            self.fields['recipient'].required = False


class ReplyMessageForm(forms.ModelForm):
    """Form for replying to messages"""
    
    class Meta:
        model = DirectMessage
        fields = ['message']
        widgets = {
            'message': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': _('Type your reply...'),
                'rows': 4,
            }),
        }
        labels = {
            'message': _('Reply'),
        }
