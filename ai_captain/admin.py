"""
AI Virtual Barangay Captain Admin
"""
from django.contrib import admin
from .models import (
    Conversation, Message, PolicyDocument, 
    SituationTemplate, CaptainPersonality, AdviceLog
)


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['session_id', 'user', 'conversation_topic', 'started_at', 'is_active', 'satisfaction_rating']
    list_filter = ['is_active', 'started_at', 'satisfaction_rating']
    search_fields = ['session_id', 'user__username', 'conversation_topic']
    readonly_fields = ['session_id', 'started_at', 'ended_at']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['conversation', 'intent_detected', 'confidence_score', 'timestamp', 'was_helpful']
    list_filter = ['intent_detected', 'was_helpful', 'timestamp']
    search_fields = ['user_message', 'captain_response']
    readonly_fields = ['timestamp']


@admin.register(PolicyDocument)
class PolicyDocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'ordinance_number', 'effective_date', 'is_active', 'times_referenced']
    list_filter = ['category', 'is_active', 'effective_date']
    search_fields = ['title', 'keywords', 'ordinance_number']
    readonly_fields = ['times_referenced', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'category', 'ordinance_number', 'effective_date', 'is_active')
        }),
        ('Content', {
            'fields': ('summary', 'content', 'keywords')
        }),
        ('Metadata', {
            'fields': ('times_referenced', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(SituationTemplate)
class SituationTemplateAdmin(admin.ModelAdmin):
    list_display = ['title', 'situation_type', 'times_used', 'is_active']
    list_filter = ['situation_type', 'is_active']
    search_fields = ['title', 'description']
    readonly_fields = ['times_used', 'created_at', 'updated_at']
    filter_horizontal = ['related_policies']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('situation_type', 'title', 'description', 'is_active')
        }),
        ('Guidance', {
            'fields': ('recommended_steps', 'required_documents', 'estimated_timeline')
        }),
        ('Related Information', {
            'fields': ('related_policies',)
        }),
        ('Statistics', {
            'fields': ('times_used', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(CaptainPersonality)
class CaptainPersonalityAdmin(admin.ModelAdmin):
    list_display = ['name', 'tone', 'language_style', 'is_active']
    list_filter = ['is_active', 'tone', 'language_style']
    
    fieldsets = (
        ('Identity', {
            'fields': ('name', 'greeting_message', 'is_active')
        }),
        ('Personality Traits', {
            'fields': ('tone', 'language_style', 'empathy_level')
        }),
        ('Behavior', {
            'fields': ('proactive_suggestions', 'ask_followup_questions')
        }),
        ('AI Configuration', {
            'fields': ('system_prompt',)
        }),
    )


@admin.register(AdviceLog)
class AdviceLogAdmin(admin.ModelAdmin):
    list_display = ['situation_detected', 'message', 'was_accepted', 'created_at']
    list_filter = ['was_accepted', 'situation_detected', 'created_at']
    search_fields = ['situation_detected', 'advice_given']
    readonly_fields = ['created_at']
