"""
AI Virtual Barangay Captain Views
"""
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse, HttpResponseForbidden
from django.utils.translation import gettext as _
from django.utils import timezone
from django.conf import settings
from .models import (
    Conversation, Message, PolicyDocument, 
    SituationTemplate, CaptainPersonality, AdviceLog
)
import uuid
import json
import os

# Try to import OpenAI (optional)
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


@login_required
def captain_chat_view(request):
    """Main chat interface with AI Captain (residents only)"""
    if not request.user.is_resident():
        messages.error(request, _('AI Virtual Captain is available only for residents.'))
        return redirect('dashboard:home')

    personality = CaptainPersonality.objects.filter(is_active=True).first()
    
    context = {
        'captain_name': personality.name if personality else "Virtual Captain",
        'greeting': personality.greeting_message if personality else "Hello! How can I help you today?",
    }
    
    return render(request, 'ai_captain/chat.html', context)


@login_required
def start_conversation_api(request):
    """Start new conversation with AI Captain (residents only)"""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=400)
    
    # Only residents can start conversations
    if not request.user.is_resident():
        return JsonResponse({'error': 'Forbidden'}, status=403)

    session_id = str(uuid.uuid4())
    user = request.user
    
    conversation = Conversation.objects.create(
        user=user,
        session_id=session_id,
        is_active=True
    )
    
    personality = CaptainPersonality.objects.filter(is_active=True).first()
    greeting = personality.greeting_message if personality else _("Hello! I'm your Virtual Barangay Captain. How can I assist you today?")
    
    return JsonResponse({
        'session_id': session_id,
        'greeting': greeting,
        'captain_name': personality.name if personality else "Virtual Captain"
    })


@login_required
def chat_api(request):
    """Process messages with AI Captain (residents only)"""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=400)
    
    if not request.user.is_resident():
        return JsonResponse({'error': 'Forbidden'}, status=403)

    user_message = request.POST.get('message', '').strip()
    session_id = request.POST.get('session_id', '')
    
    if not user_message or not session_id:
        return JsonResponse({'error': 'Message and session_id required'}, status=400)
    
    try:
        conversation = Conversation.objects.get(session_id=session_id, is_active=True)
    except Conversation.DoesNotExist:
        return JsonResponse({'error': 'Invalid session'}, status=404)
    
    # Get AI response
    captain_response, intent, confidence, policies_used = process_with_ai_captain(
        user_message, 
        conversation
    )
    
    # Save message
    message = Message.objects.create(
        conversation=conversation,
        user_message=user_message,
        captain_response=captain_response,
        intent_detected=intent,
        confidence_score=confidence,
        referenced_policies=','.join([str(p.id) for p in policies_used])
    )
    
    # Check if personalized advice was given
    situation_detected = detect_situation(user_message)
    if situation_detected:
        AdviceLog.objects.create(
            message=message,
            situation_detected=situation_detected,
            advice_given=captain_response,
            policies_cited=','.join([p.title for p in policies_used])
        )
    
    return JsonResponse({
        'response': captain_response,
        'intent': intent,
        'confidence': confidence,
        'policies': [{'id': p.id, 'title': p.title} for p in policies_used],
        'message_id': message.id
    })


@login_required
def end_conversation_api(request):
    """End conversation and collect feedback (residents only)"""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=400)
    
    if not request.user.is_resident():
        return JsonResponse({'error': 'Forbidden'}, status=403)

    session_id = request.POST.get('session_id')
    rating = request.POST.get('rating')
    
    try:
        conversation = Conversation.objects.get(session_id=session_id)
        conversation.is_active = False
        conversation.ended_at = timezone.now()
        
        if rating:
            conversation.satisfaction_rating = int(rating)
        
        conversation.save()
        
        return JsonResponse({'success': True})
    except Conversation.DoesNotExist:
        return JsonResponse({'error': 'Session not found'}, status=404)


@login_required
def message_feedback_api(request):
    """Submit feedback on specific message (residents only)"""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=400)
    
    if not request.user.is_resident():
        return JsonResponse({'error': 'Forbidden'}, status=403)

    message_id = request.POST.get('message_id')
    was_helpful = request.POST.get('was_helpful') == 'true'
    
    try:
        message = Message.objects.get(id=message_id)
        message.was_helpful = was_helpful
        message.save()
        
        return JsonResponse({'success': True})
    except Message.DoesNotExist:
        return JsonResponse({'error': 'Message not found'}, status=404)


@login_required
def policy_management(request):
    """Manage policy documents"""
    if not request.user.is_official():
        messages.error(request, _('Access denied.'))
        return redirect('dashboard:home')
    
    policies = PolicyDocument.objects.all().order_by('-created_at')
    
    context = {
        'policies': policies,
        'total_policies': policies.count(),
        'active_policies': policies.filter(is_active=True).count(),
    }
    
    return render(request, 'ai_captain/policy_management.html', context)


@login_required
def conversation_analytics(request):
    """View conversation analytics"""
    if not request.user.is_official():
        messages.error(request, _('Access denied.'))
        return redirect('dashboard:home')
    
    conversations = Conversation.objects.all()
    messages_count = Message.objects.count()
    
    # Calculate average satisfaction
    rated_conversations = conversations.exclude(satisfaction_rating__isnull=True)
    avg_satisfaction = rated_conversations.aggregate(
        avg=models.Avg('satisfaction_rating')
    )['avg'] or 0
    
    # Top intents
    from django.db.models import Count
    top_intents = Message.objects.values('intent_detected').annotate(
        count=Count('id')
    ).order_by('-count')[:10]
    
    # Recent conversations
    recent_conversations = conversations.order_by('-started_at')[:20]
    
    context = {
        'total_conversations': conversations.count(),
        'total_messages': messages_count,
        'avg_satisfaction': round(avg_satisfaction, 2),
        'top_intents': top_intents,
        'recent_conversations': recent_conversations,
    }
    
    return render(request, 'ai_captain/analytics.html', context)


# Helper Functions

def process_with_ai_captain(user_message, conversation):
    """Process message with AI Captain intelligence"""
    
    # Get personality settings
    personality = CaptainPersonality.objects.filter(is_active=True).first()
    
    # Search for relevant policies
    relevant_policies = search_relevant_policies(user_message)
    
    # Detect intent and situation
    intent = detect_intent(user_message)
    situation = detect_situation(user_message)
    
    # Build context for AI
    context = build_conversation_context(conversation, relevant_policies, situation)
    
    # Generate response
    if OPENAI_AVAILABLE and hasattr(settings, 'OPENAI_API_KEY') and settings.OPENAI_API_KEY:
        response, confidence = generate_ai_response_openai(
            user_message, 
            context, 
            personality
        )
    else:
        response, confidence = generate_rule_based_response(
            user_message, 
            intent, 
            situation, 
            relevant_policies
        )
    
    # Update conversation context
    if situation and not conversation.conversation_topic:
        conversation.conversation_topic = situation
        conversation.save()
    
    return response, intent, confidence, relevant_policies


def search_relevant_policies(query):
    """Search for relevant policy documents"""
    policies = []
    
    # Simple keyword search
    query_lower = query.lower()
    all_policies = PolicyDocument.objects.filter(is_active=True)
    
    for policy in all_policies:
        keywords = [k.strip().lower() for k in policy.keywords.split(',')]
        
        # Check if any keyword is in query
        if any(keyword in query_lower for keyword in keywords if keyword):
            policies.append(policy)
            policy.times_referenced += 1
            policy.save()
        
        # Also check title and summary
        elif query_lower in policy.title.lower() or query_lower in policy.summary.lower():
            policies.append(policy)
            policy.times_referenced += 1
            policy.save()
    
    return policies[:3]  # Return top 3 most relevant


def detect_intent(message):
    """Detect user intent from message with enhanced keyword matching"""
    message_lower = message.lower()
    
    # Expanded intents with more comprehensive keywords
    intents = {
        'greeting': [
            'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
            'kumusta', 'kamusta', 'magandang umaga', 'magandang hapon', 'magandang gabi',
            'musta', 'morning', 'evening', 'afternoon'
        ],
        'help': [
            'help', 'tulong', 'assist', 'guide', 'kailangan', 'need help', 
            'patulong', 'help me', 'tulungan', 'pano', 'how to', 'pwede ba'
        ],
        'complaint': [
            'complaint', 'reklamo', 'problem', 'issue', 'concern', 'report',
            'maingay', 'noise', 'disturbance', 'away', 'alitan', 'trouble',
            'gusto kong ireklamo', 'mag-complain', 'problema', 'hirap'
        ],
        'document': [
            'document', 'certificate', 'clearance', 'permit', 'id', 'cedula',
            'certification', 'papel', 'dokumento', 'kailangan ng', 'need a',
            'barangay clearance', 'brgy clearance', 'residency', 'indigency',
            'certificate of', 'requirement', 'requirements'
        ],
        'policy': [
            'policy', 'ordinance', 'rule', 'regulation', 'batas', 'alituntunin',
            'patakaran', 'ordinansa', 'what is the policy', 'ano ang batas',
            'bawal ba', 'pwede ba', 'allowed', 'legal'
        ],
        'business': [
            'business', 'negosyo', 'permit', 'business permit', 'tindahan',
            'store', 'sari-sari', 'shop', 'online business', 'home based',
            'magtayo ng negosyo', 'start a business', 'renewal', 'renew'
        ],
        'construction': [
            'construction', 'building', 'renovate', 'gusali', 'build', 'itayo',
            'pagawa', 'house', 'bahay', 'garage', 'extension', 'repair',
            'fence', 'bakod', 'gate', 'remodel', 'addition'
        ],
        'emergency': [
            'emergency', 'urgent', 'asap', 'help now', 'fire', 'sunog',
            'flood', 'baha', 'accident', 'aksidente', 'injured', 'sugatan',
            'violence', 'abuse', 'danger', 'panganib', 'immediately', 'agad'
        ],
        'information': [
            'what', 'when', 'where', 'how', 'who', 'why',
            'ano', 'saan', 'paano', 'kailan', 'sino', 'bakit',
            'information', 'info', 'details', 'impormasyon', 'schedule',
            'office hours', 'location', 'contact', 'number'
        ],
    }
    
    # Score each intent based on keyword matches
    intent_scores = {}
    for intent_name, keywords in intents.items():
        score = sum(1 for keyword in keywords if keyword in message_lower)
        if score > 0:
            intent_scores[intent_name] = score
    
    # Return intent with highest score, or 'general' if no matches
    if intent_scores:
        return max(intent_scores, key=intent_scores.get)
    
    return 'general'


def detect_situation(message):
    """Detect specific situation type with enhanced accuracy"""
    message_lower = message.lower()
    
    # Expanded situations with more specific keywords
    situations = {
        'Filing Complaint': [
            'complaint', 'reklamo', 'report', 'mag-complain', 'ireklamo',
            'problema sa', 'issue with', 'gusto kong mag-report', 'file a complaint'
        ],
        'Document Request': [
            'document', 'certificate', 'clearance', 'id', 'certification',
            'kailangan ng', 'need a', 'apply for', 'get a', 'request',
            'barangay clearance', 'residency', 'indigency', 'cedula'
        ],
        'Business Permit': [
            'business permit', 'negosyo', 'business', 'permit para sa negosyo',
            'magtayo ng negosyo', 'open a business', 'start business',
            'tindahan', 'sari-sari', 'online business', 'renewal ng business'
        ],
        'Construction Permit': [
            'construction', 'building permit', 'renovate', 'build', 'itayo',
            'pagawa', 'construct', 'extension', 'addition', 'repair',
            'fence', 'gate', 'construction clearance', 'building clearance'
        ],
        'Neighbor Dispute': [
            'neighbor', 'kapitbahay', 'dispute', 'away', 'alitan',
            'problema sa kapitbahay', 'issue with neighbor', 'boundary',
            'hangganan', 'noise from neighbor', 'maingay na kapitbahay'
        ],
        'Emergency': [
            'emergency', 'urgent', 'fire', 'flood', 'sunog', 'baha',
            'accident', 'aksidente', 'help now', 'agad', 'emergency situation',
            'violence', 'danger', 'injured', 'medical emergency'
        ],
        'Social Welfare': [
            'assistance', 'tulong', 'ayuda', 'financial help', 'indigency',
            'medical assistance', 'tulong medikal', 'scholarship', 'burial assistance',
            'senior citizen', 'pwd', 'person with disability', 'ayuda pang-medika'
        ],
        'Community Events': [
            'event', 'program', 'activity', 'celebration', 'meeting',
            'assembly', 'pulong', 'gathering', 'fiesta', 'community program'
        ],
    }
    
    # Score each situation based on keyword matches
    situation_scores = {}
    for situation_name, keywords in situations.items():
        score = sum(1 for keyword in keywords if keyword in message_lower)
        if score > 0:
            situation_scores[situation_name] = score
    
    # Return situation with highest score
    if situation_scores:
        return max(situation_scores, key=situation_scores.get)
    
    return None


def build_conversation_context(conversation, policies, situation):
    """Build context for AI response"""
    context = {
        'user_profile': None,
        'conversation_history': [],
        'relevant_policies': policies,
        'situation': situation,
        'situation_template': None
    }
    
    # Get user profile if available
    if conversation.user:
        context['user_profile'] = {
            'name': conversation.user.get_full_name(),
            'role': conversation.user.role,
        }
    
    # Get conversation history
    recent_messages = conversation.messages.order_by('-timestamp')[:5]
    context['conversation_history'] = [
        {'user': m.user_message, 'captain': m.captain_response}
        for m in reversed(recent_messages)
    ]
    
    # Get situation template if applicable
    if situation:
        template = SituationTemplate.objects.filter(
            title__icontains=situation,
            is_active=True
        ).first()
        
        if template:
            context['situation_template'] = template
            template.times_used += 1
            template.save()
    
    return context


def generate_ai_response_openai(message, context, personality):
    """Generate response using OpenAI API"""
    try:
        openai.api_key = settings.OPENAI_API_KEY
        
        # Build enhanced system prompt
        system_prompt = personality.system_prompt if personality else (
            "You are a Virtual Barangay Captain assistant for a Philippine barangay. "
            "Provide realistic, informative, and empathetic responses."
        )
        
        # Add detailed instructions for realistic responses
        system_prompt += "\n\nGuidelines:\n"
        system_prompt += "- Mix Filipino and English naturally (Taglish) for authenticity\n"
        system_prompt += "- Provide specific, actionable steps with clear timelines\n"
        system_prompt += "- Reference actual barangay procedures and requirements\n"
        system_prompt += "- Show empathy and understanding of residents' situations\n"
        system_prompt += "- Include office hours, contact details, and who to approach\n"
        system_prompt += "- Mention fees, required documents, and processing times\n"
        system_prompt += "- Use emojis sparingly for clarity (📋 for documents, ⏱️ for time, 📍 for location)\n"
        system_prompt += "- Be conversational but professional\n"
        system_prompt += "- Ask follow-up questions to better understand their situation\n"
        
        # Add user context
        if context['user_profile']:
            user_info = context['user_profile']
            system_prompt += f"\n\nYou are speaking with: {user_info['name']} (Role: {user_info['role']})\n"
        
        # Add policy context
        if context['relevant_policies']:
            policy_info = "\n\nRelevant Barangay Policies and Information:\n"
            for policy in context['relevant_policies']:
                policy_info += f"\n📋 {policy.title}\n"
                policy_info += f"Summary: {policy.summary}\n"
                if policy.ordinance_number:
                    policy_info += f"Reference: {policy.ordinance_number}\n"
            system_prompt += policy_info
        
        # Add situation template with detailed guidance
        if context['situation_template']:
            template = context['situation_template']
            system_prompt += f"\n\n🎯 Situation-Specific Guidance for '{template.title}':\n"
            system_prompt += f"\nStep-by-step process:\n{template.recommended_steps}\n"
            if template.required_documents:
                system_prompt += f"\nRequired Documents:\n{template.required_documents}\n"
            if template.estimated_timeline:
                system_prompt += f"\nExpected Timeline: {template.estimated_timeline}\n"
        
        # Build messages
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # Add conversation history
        for hist in context['conversation_history']:
            messages.append({"role": "user", "content": hist['user']})
            messages.append({"role": "assistant", "content": hist['captain']})
        
        # Add current message
        messages.append({"role": "user", "content": message})
        
        # Call OpenAI
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=messages,
            temperature=0.7,
            max_tokens=800
        )
        
        answer = response.choices[0].message.content
        confidence = 0.9
        
        return answer, confidence
        
    except Exception as e:
        print(f"OpenAI Error: {e}")
        return generate_rule_based_response(message, detect_intent(message), context['situation'], context['relevant_policies'])


def generate_rule_based_response(message, intent, situation, policies):
    """Generate realistic, informative rule-based response (fallback)"""
    
    # More detailed and realistic responses with Filipino/English mix
    responses = {
        'greeting': (
            "Good day po! Ako ang inyong Virtual Barangay Captain. 🏛️\n\n"
            "I'm here to assist you with:\n"
            "• Filing complaints and concerns\n"
            "• Document requests (Clearance, Certifications, Permits)\n"
            "• Information about barangay services and programs\n"
            "• Guidance on barangay procedures and requirements\n\n"
            "Paano ko po kayo matutulungan ngayong araw?"
        ),
        'help': (
            "Salamat for reaching out! I'm here to help you navigate barangay services. 😊\n\n"
            "Here's what I can assist you with:\n\n"
            "📝 **Complaints & Concerns**\n"
            "   - Noise complaints, disputes, peace and order issues\n"
            "   - Process: File at the barangay hall (Monday-Friday, 8AM-5PM)\n\n"
            "📋 **Document Requests**\n"
            "   - Barangay Clearance: ₱50 (1-2 days processing)\n"
            "   - Certificate of Residency: ₱30 (same day)\n"
            "   - Certificate of Indigency: Free (1 day processing)\n\n"
            "💼 **Business & Construction Permits**\n\n"
            "❓ **Policy Questions & Information**\n\n"
            "Ano pong specific na tulong ang kailangan ninyo?"
        ),
        'complaint': (
            "I understand you have a concern to report. Nandito ako para gabayan kayo. 🤝\n\n"
            "**Process for Filing a Complaint:**\n\n"
            "1️⃣ **Visit the Barangay Hall**\n"
            "   📍 Location: [Barangay Office Address]\n"
            "   ⏰ Office Hours: Monday-Friday, 8:00 AM - 5:00 PM\n"
            "   🍽️ Lunch Break: 12:00 - 1:00 PM\n\n"
            "2️⃣ **Prepare These Documents:**\n"
            "   • Valid ID (any government-issued ID)\n"
            "   • Proof of residency (if available)\n"
            "   • Any evidence related to your complaint (photos, documents, etc.)\n\n"
            "3️⃣ **Fill Out the Complaint Form**\n"
            "   - Available at the Secretary's desk\n"
            "   - No filing fee required\n\n"
            "4️⃣ **Mediation/Hearing Schedule**\n"
            "   - Usually scheduled within 3-5 working days\n"
            "   - Both parties will be notified\n\n"
            "Could you share more details about your concern? "
            "This will help me give you more specific guidance. (Anong klaseng complaint po ito?)"
        ),
        'document': (
            "I can definitely help you with document requests! 📄\n\n"
            "**Available Barangay Documents:**\n\n"
            "🏠 **Barangay Clearance**\n"
            "   • Fee: ₱50\n"
            "   • Processing: 1-2 working days\n"
            "   • Requirements: Valid ID, Cedula, 1x1 photo\n"
            "   • Purpose: Employment, business, travel, etc.\n\n"
            "📍 **Certificate of Residency**\n"
            "   • Fee: ₱30\n"
            "   • Processing: Same day\n"
            "   • Requirements: Valid ID, proof of address\n\n"
            "💰 **Certificate of Indigency**\n"
            "   • Fee: FREE\n"
            "   • Processing: 1 working day\n"
            "   • Requirements: Valid ID, interview with social worker\n"
            "   • Purpose: Medical assistance, scholarship, legal aid\n\n"
            "👶 **Barangay ID**\n"
            "   • Fee: ₱30 (initial), ₱20 (renewal)\n"
            "   • Processing: 3-5 working days\n"
            "   • Requirements: 1x1 photo, proof of residency\n\n"
            "**How to Apply:**\n"
            "Visit our office at [Barangay Office], Monday-Friday, 8AM-5PM\n"
            "Approach the Document Processing window\n\n"
            "Anong document po specifically ang kailangan ninyo?"
        ),
        'policy': (
            "I can help clarify our barangay policies and ordinances. 📜\n\n"
            "Our barangay has various policies covering:\n"
            "• Peace and order regulations\n"
            "• Business and construction permits\n"
            "• Environmental protection\n"
            "• Public health and sanitation\n"
            "• Community welfare programs\n\n"
            "Could you tell me which specific policy or topic you'd like to know about? "
            "(Ano pong specific na policy ang gusto ninyong alamin?)"
        ),
        'emergency': (
            "⚠️ **EMERGENCY PROTOCOLS** ⚠️\n\n"
            "**For Life-Threatening Emergencies:**\n"
            "🚨 Call 911 immediately\n"
            "🚑 Emergency: Fire, Medical, Police\n\n"
            "**Barangay Emergency Contacts:**\n"
            "📞 Barangay Emergency Hotline: [Contact Number]\n"
            "📞 Barangay Tanod: [Contact Number]\n"
            "📞 Barangay Health Center: [Contact Number]\n\n"
            "**For Non-Life-Threatening Urgent Matters:**\n"
            "Please describe your situation and I'll connect you with the right assistance immediately.\n\n"
            "Ano pong emergency situation po ito? I'll help coordinate the response."
        ),
        'business': (
            "Let me guide you through the business permit process! 💼\n\n"
            "**Barangay Business Permit Requirements:**\n\n"
            "📋 **Documents Needed:**\n"
            "1. DTI/SEC/CDA Registration (original and photocopy)\n"
            "2. Valid ID of owner\n"
            "3. Barangay Clearance (₱50)\n"
            "4. Cedula\n"
            "5. Location sketch/map\n"
            "6. Lease contract (if renting)\n"
            "7. Fire Safety Inspection Certificate (for physical stores)\n\n"
            "💵 **Fees:**\n"
            "• Home-based business: ₱500-₱1,000\n"
            "• Small retail: ₱1,000-₱3,000\n"
            "• Varies by business type and location\n\n"
            "⏱️ **Processing Time:** 3-5 working days\n\n"
            "**Process:**\n"
            "1. Visit Barangay Hall Document Processing\n"
            "2. Submit requirements\n"
            "3. Pay fees at the cashier\n"
            "4. Schedule inspection (if needed)\n"
            "5. Claim permit\n\n"
            "Anong type of business po ang planado ninyo?"
        ),
        'construction': (
            "I'll help you with construction permit requirements! 🏗️\n\n"
            "**Barangay Construction Clearance Process:**\n\n"
            "📋 **Required Documents:**\n"
            "1. Barangay Clearance of lot owner\n"
            "2. Tax Declaration or Certificate of Title (photocopy)\n"
            "3. Building plans/blueprints (signed by licensed engineer/architect)\n"
            "4. Location plan\n"
            "5. Valid ID\n"
            "6. Vicinity map\n\n"
            "💵 **Barangay Clearance Fee:** ₱500-₱2,000\n"
            "   (Depends on project size and type)\n\n"
            "⏱️ **Processing Time:** 5-7 working days\n\n"
            "**Important Notes:**\n"
            "• Inspection by barangay engineer required\n"
            "• Neighbors' consent may be needed (for major constructions)\n"
            "• After barangay clearance, proceed to municipal engineering office\n\n"
            "**Types of Construction:**\n"
            "• New building: Full documentation required\n"
            "• Renovation: Simplified requirements\n"
            "• Fence only: Faster processing\n\n"
            "Anong type of construction project po ang plano ninyo?"
        ),
        'information': (
            "I'm here to provide information! 📚\n\n"
            "I can give you details about:\n"
            "• Barangay services and programs\n"
            "• Document requirements and fees\n"
            "• Office hours and contact information\n"
            "• Barangay officials and their responsibilities\n"
            "• Community events and announcements\n"
            "• Procedures for various transactions\n\n"
            "What specific information do you need? (Ano pong specific na information ang kailangan ninyo?)"
        ),
    }
    
    # Get base response with fallback
    response = responses.get(
        intent, 
        "Thank you for reaching out. Para mas matulungan ko kayo nang maayos, "
        "could you please provide more details about your concern? \n\n"
        "Pwede ninyong ikwento ang inyong sitwasyon in more detail, "
        "para makapagbigay ako ng specific at accurate na guidance. 🤝"
    )
    
    # Add policy information if available
    if policies:
        response += "\n\n━━━━━━━━━━━━━━━━━━━━━\n"
        response += "**📋 Relevant Barangay Policies:**\n\n"
        for i, policy in enumerate(policies, 1):
            response += f"{i}. **{policy.title}**\n"
            response += f"   {policy.summary}\n"
            if policy.ordinance_number:
                response += f"   *(Reference: {policy.ordinance_number})*\n"
            response += "\n"
    
    # Add situation-specific guidance
    if situation:
        template = SituationTemplate.objects.filter(
            title__icontains=situation,
            is_active=True
        ).first()
        
        if template:
            response += "\n━━━━━━━━━━━━━━━━━━━━━\n"
            response += f"**🎯 Specific Guidance for: {template.title}**\n\n"
            response += "**Step-by-Step Process:**\n"
            response += template.recommended_steps + "\n"
            
            if template.required_documents:
                response += "\n**📄 Required Documents:**\n"
                response += template.required_documents + "\n"
            
            if template.estimated_timeline:
                response += f"\n**⏱️ Expected Timeline:** {template.estimated_timeline}\n"
            
            # Add related policies
            related_policies = template.related_policies.filter(is_active=True)
            if related_policies.exists():
                response += "\n**📚 Related Policies:**\n"
                for rp in related_policies[:3]:
                    response += f"• {rp.title}\n"
    
    # Add general contact information
    response += "\n\n━━━━━━━━━━━━━━━━━━━━━\n"
    response += "**📞 Contact Information:**\n"
    response += "• Office: Monday-Friday, 8:00 AM - 5:00 PM\n"
    response += "• Location: [Barangay Hall Address]\n"
    response += "• Hotline: [Contact Number]\n\n"
    response += "May additional questions pa po ba kayo? I'm here to help! 😊"
    
    confidence = 0.75
    return response, confidence


from django.db import models
