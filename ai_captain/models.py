"""
AI Virtual Barangay Captain Models
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from accounts.models import CustomUser


class Conversation(models.Model):
    """Conversation sessions with the AI Captain"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='ai_conversations', null=True, blank=True)
    session_id = models.CharField(max_length=100, unique=True)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    # User context for personalization
    user_situation = models.TextField(blank=True, help_text="Summary of user's situation")
    conversation_topic = models.CharField(max_length=200, blank=True)
    
    # Satisfaction rating
    satisfaction_rating = models.IntegerField(null=True, blank=True, choices=[(i, i) for i in range(1, 6)])
    
    class Meta:
        verbose_name = _('AI Captain Conversation')
        verbose_name_plural = _('AI Captain Conversations')
        ordering = ['-started_at']
    
    def __str__(self):
        return f"Conversation {self.session_id} - {self.user or 'Anonymous'}"


class Message(models.Model):
    """Messages in conversation"""
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    
    # Message content
    user_message = models.TextField()
    captain_response = models.TextField()
    
    # AI metadata
    intent_detected = models.CharField(max_length=100, blank=True)
    confidence_score = models.FloatField(null=True, blank=True)
    
    # References to policies or documents
    referenced_policies = models.TextField(blank=True, help_text="Comma-separated policy IDs")
    
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # User feedback on this specific message
    was_helpful = models.BooleanField(null=True, blank=True)
    
    class Meta:
        verbose_name = _('AI Captain Message')
        verbose_name_plural = _('AI Captain Messages')
        ordering = ['timestamp']
    
    def __str__(self):
        return f"{self.conversation.session_id} - {self.timestamp}"


class PolicyDocument(models.Model):
    """Barangay policies and ordinances database"""
    
    CATEGORY_CHOICES = [
        ('ordinance', _('Ordinance')),
        ('resolution', _('Resolution')),
        ('procedure', _('Procedure')),
        ('requirement', _('Requirement')),
        ('guideline', _('Guideline')),
        ('faq', _('FAQ')),
    ]
    
    title = models.CharField(max_length=500)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    content = models.TextField(help_text="Full policy content")
    summary = models.TextField(help_text="Brief summary for AI context")
    
    # Keywords for search
    keywords = models.TextField(help_text="Comma-separated keywords")
    
    # Metadata
    ordinance_number = models.CharField(max_length=100, blank=True)
    effective_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    # Usage tracking
    times_referenced = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='created_policies')
    
    class Meta:
        verbose_name = _('Policy Document')
        verbose_name_plural = _('Policy Documents')
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title


class SituationTemplate(models.Model):
    """Templates for common resident situations"""
    
    SITUATION_TYPE_CHOICES = [
        ('complaint', _('Filing Complaint')),
        ('document', _('Document Request')),
        ('business', _('Business Permit')),
        ('construction', _('Construction Permit')),
        ('dispute', _('Neighbor Dispute')),
        ('emergency', _('Emergency Situation')),
        ('welfare', _('Social Welfare')),
        ('other', _('Other')),
    ]
    
    situation_type = models.CharField(max_length=50, choices=SITUATION_TYPE_CHOICES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # AI guidance
    recommended_steps = models.TextField(help_text="Step-by-step guidance")
    required_documents = models.TextField(blank=True)
    estimated_timeline = models.CharField(max_length=200, blank=True)
    
    # Related policies
    related_policies = models.ManyToManyField(PolicyDocument, blank=True)
    
    # Usage tracking
    times_used = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Situation Template')
        verbose_name_plural = _('Situation Templates')
    
    def __str__(self):
        return self.title


class CaptainPersonality(models.Model):
    """Configurable personality settings for the AI Captain"""
    
    name = models.CharField(max_length=100, default="Kapitan AI")
    greeting_message = models.TextField(
        default=(
            "Magandang araw po! 👋 Ako si *Kapitan AI*, ang inyong Virtual Barangay Captain.\n\n"
            "Maaasahan n'yo ako sa mabilis na sagot tungkol sa:\n"
            "• 📋 Mga dokumento at barangay clearance\n"
            "• 💬 Pagsasampa ng reklamo at concerns\n"
            "• 🧾 Barangay services, assistance at programs\n"
            "• 📜 Mga patakaran, ordinances at proseso\n\n"
            "I-type lang ang tanong o sitwasyon n'yo at tutulungan ko kayong step‑by‑step. 😊"
        )
    )
    
    # Personality traits
    tone = models.CharField(max_length=50, default="professional", 
                           help_text="professional, friendly, formal, casual")
    language_style = models.CharField(max_length=50, default="mixed",
                                     help_text="english, tagalog, mixed")
    
    # Behavior settings
    proactive_suggestions = models.BooleanField(default=True)
    ask_followup_questions = models.BooleanField(default=True)
    empathy_level = models.IntegerField(default=5, choices=[(i, i) for i in range(1, 6)])
    
    # System prompts
    system_prompt = models.TextField(
        default=(
            "You are *Kapitan AI*, the Virtual Barangay Captain for a Philippine barangay community. "
            "Your role is to provide realistic, practical, and empathetic assistance to residents.\n\n"
            "COMMUNICATION STYLE:\n"
            "- Use natural Taglish (mix of Filipino and English) for authenticity.\n"
            "- Sound warm, approachable, and trustworthy – like a real barangay captain.\n"
            "- Be concise: most answers should fit in 3–7 short paragraphs or bullet lists.\n"
            "- Always stay respectful and non‑judgmental.\n\n"
            "RESPONSE GUIDELINES:\n"
            "- Start with a 1–2 sentence acknowledgement showing you understand the concern.\n"
            "- Give clear, numbered steps with timelines when explaining processes.\n"
            "- Include practical details: fees, required documents, office hours, processing times.\n"
            "- Mention who to approach and where to go (office name, window/desk, or online option).\n"
            "- Ask follow‑up questions if the situation is not clear.\n"
            "- Offer proactive suggestions and remind residents of their rights and responsibilities.\n\n"
            "INFORMATION TO INCLUDE WHEN RELEVANT:\n"
            "- Contact information (phone numbers, office hours, locations).\n"
            "- Document requirements and fees.\n"
            "- Processing times and what happens after they submit.\n"
            "- Related policies or ordinances (with simple explanations).\n"
            "- Alternative options if the usual process does not apply.\n\n"
            "FORMAT:\n"
            "- Use emojis sparingly for clarity (📋 documents, ⏱️ time, 📍 location, 💵 fees).\n"
            "- Use bullet points and numbered steps for processes.\n"
            "- Highlight very important notes with labels like 'Important:' or 'Reminder:'.\n\n"
            "Your goal is to make barangay services *simple and less intimidating* for residents."
        )
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Captain Personality')
        verbose_name_plural = _('Captain Personalities')
    
    def __str__(self):
        return self.name


class AdviceLog(models.Model):
    """Log of personalized advice given"""
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='advice_logs')
    
    situation_detected = models.CharField(max_length=200)
    advice_given = models.TextField()
    policies_cited = models.TextField(blank=True)
    
    # Outcome tracking
    was_accepted = models.BooleanField(null=True, blank=True)
    user_feedback = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('Advice Log')
        verbose_name_plural = _('Advice Logs')
    
    def __str__(self):
        return f"Advice for {self.situation_detected}"
