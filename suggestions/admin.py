"""
Suggestions admin
"""
from django.contrib import admin
from .models import Suggestion, SuggestionVote


@admin.register(Suggestion)
class SuggestionAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'status', 'vote_count', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['title', 'description', 'user__username']
    readonly_fields = ['created_at', 'updated_at', 'reviewed_at', 'vote_count']


@admin.register(SuggestionVote)
class SuggestionVoteAdmin(admin.ModelAdmin):
    list_display = ['suggestion', 'user', 'created_at']
    list_filter = ['created_at']
    search_fields = ['suggestion__title', 'user__username']

