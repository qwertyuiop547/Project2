"""
Initialize AI Captain with default data
"""
from django.core.management.base import BaseCommand
from ai_captain.models import CaptainPersonality, PolicyDocument, SituationTemplate


class Command(BaseCommand):
    help = 'Initialize AI Captain with default personality and sample policies'

    def handle(self, *args, **kwargs):
        # Create default personality
        personality, created = CaptainPersonality.objects.get_or_create(
            name="Captain AI",
            defaults={
                'greeting_message': "Kumusta! I'm your Virtual Barangay Captain. I'm here to help you with any concerns, questions, or requests you may have. How can I assist you today?",
                'tone': 'friendly',
                'language_style': 'mixed',
                'proactive_suggestions': True,
                'ask_followup_questions': True,
                'empathy_level': 5,
                'system_prompt': """You are a helpful and empathetic Virtual Barangay Captain for a Filipino barangay community. 
Your role is to:
1. Answer questions about barangay policies, procedures, and services
2. Provide personalized advice based on residents' specific situations
3. Guide residents through processes like filing complaints, requesting documents, or applying for permits
4. Be culturally sensitive and understand Filipino community dynamics
5. Use a mix of English and Tagalog when appropriate
6. Show empathy and understanding for residents' concerns
7. Always cite relevant policies or ordinances when giving advice
8. Maintain a professional yet warm and friendly tone

Remember: You represent the barangay government, so your advice should be accurate and helpful.""",
                'is_active': True
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS('[OK] Created default AI Captain personality'))
        else:
            self.stdout.write(self.style.WARNING('Default personality already exists'))
        
        # Create sample policies
        sample_policies = [
            {
                'title': 'Barangay Clearance Application Process',
                'category': 'procedure',
                'summary': 'Requirements and steps to apply for a barangay clearance certificate.',
                'content': """To apply for a Barangay Clearance:
1. Visit the barangay hall during office hours (Mon-Fri, 8AM-5PM)
2. Fill out the application form
3. Present valid ID
4. Pay the clearance fee (₱50)
5. Processing time: 1-2 business days

Required Documents:
- Valid government-issued ID
- Proof of residency (utility bill, rental contract, or affidavit)
- 1x1 ID photo
- Cedula (Community Tax Certificate)""",
                'keywords': 'clearance, certificate, barangay clearance, requirements, documents',
            },
            {
                'title': 'Noise Ordinance Policy',
                'category': 'ordinance',
                'ordinance_number': 'BO-2023-001',
                'summary': 'Regulations on noise levels and quiet hours in the barangay.',
                'content': """Barangay Ordinance No. 2023-001: Noise Control

Quiet Hours: 10:00 PM to 6:00 AM on weekdays, 11:00 PM to 7:00 AM on weekends

Prohibited Activities during quiet hours:
- Loud music or karaoke
- Construction work
- Use of power tools
- Vehicle horn honking (except emergencies)

Penalties:
- First offense: Warning
- Second offense: ₱500 fine
- Third offense: ₱1,000 fine and possible legal action

Exemptions:
- Emergency situations
- Authorized barangay events
- Religious activities (with permit)""",
                'keywords': 'noise, sound, karaoke, loud, music, quiet hours, ordinance',
            },
            {
                'title': 'Business Permit Requirements',
                'category': 'requirement',
                'summary': 'Documents and requirements for obtaining a barangay business permit.',
                'content': """Business Permit Requirements:

For New Businesses:
1. Barangay Clearance
2. Business Name Registration (DTI for sole proprietorship)
3. Location Plan/Sketch
4. Contract of Lease (if renting)
5. Occupancy Permit
6. Fire Safety Inspection Certificate
7. Sanitary Permit (for food-related businesses)
8. Valid ID of owner

For Renewal:
1. Previous year's permit
2. Valid ID
3. Proof of payment of previous year's fees
4. Updated barangay clearance

Processing Fee: ₱500-₱2,000 (depending on business type)
Processing Time: 3-5 business days""",
                'keywords': 'business, permit, requirements, documents, business permit, negosyo',
            },
            {
                'title': 'Complaint Filing Procedure',
                'category': 'procedure',
                'summary': 'How to properly file a complaint with the barangay.',
                'content': """Filing a Complaint:

Step 1: Visit the barangay hall
Step 2: Approach the complaints desk
Step 3: Fill out the complaint form with details
Step 4: Submit supporting documents/evidence (if any)
Step 5: Receive complaint reference number
Step 6: Wait for investigation and resolution

Types of Complaints Handled:
- Neighbor disputes
- Noise violations
- Property disputes
- Community concerns
- Service complaints

Timeline:
- Initial response: Within 24 hours
- Investigation: 3-7 days
- Resolution: 7-30 days (depending on complexity)

You can also file complaints online through our portal.""",
                'keywords': 'complaint, reklamo, file complaint, dispute, problem, issue',
            },
            {
                'title': 'Construction Permit Guidelines',
                'category': 'guideline',
                'summary': 'Guidelines for obtaining construction permits in the barangay.',
                'content': """Construction Permit Requirements:

For Minor Construction (repairs, renovation):
1. Barangay Clearance
2. Location Plan
3. Simple building plan/sketch
4. Valid ID
Fee: ₱300-₱500

For Major Construction (new building, addition):
1. Barangay Clearance
2. Building Permit from City Hall
3. Structural plans approved by engineer
4. Lot title/proof of ownership
5. Tax declaration
6. Occupancy certificate
Fee: ₱1,000-₱5,000

Important Notes:
- Construction allowed: 7AM-6PM only
- Must not obstruct public pathways
- Must comply with zoning regulations
- Inspection will be conducted during construction""",
                'keywords': 'construction, building, renovation, repair, permit, gusali',
            },
            {
                'title': 'Residency Certificate (Cedula)',
                'category': 'procedure',
                'summary': 'How to obtain a Community Tax Certificate (Cedula).',
                'content': """Community Tax Certificate (Cedula):

Who needs it:
- All residents 18 years old and above
- Required for various transactions

Requirements:
- Valid ID
- Proof of income (for employed)
- For business owners: DTI or SEC registration

Fees:
- Basic: ₱5
- Additional charges based on income/gross receipts

Where to get:
- Barangay hall (for basic cedula)
- City Treasurer's Office (for higher amounts)

Validity: Calendar year (January to December)

Note: Cedula is required when applying for:
- Barangay clearance
- Business permits
- Marriage license
- Passport application
- Many other documents""",
                'keywords': 'cedula, community tax certificate, residency, certificate, ctr',
            }
        ]
        
        created_count = 0
        for policy_data in sample_policies:
            policy, created = PolicyDocument.objects.get_or_create(
                title=policy_data['title'],
                defaults=policy_data
            )
            if created:
                created_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'[OK] Created {created_count} new policy documents'))
        
        # Create situation templates
        sample_situations = [
            {
                'situation_type': 'complaint',
                'title': 'Filing a Complaint',
                'description': 'Guide for residents who want to file a complaint',
                'recommended_steps': """1. Gather all relevant information and evidence
2. Visit the barangay hall complaints desk (or file online)
3. Fill out the complaint form with complete details
4. Submit any supporting documents (photos, videos, witnesses)
5. Receive your complaint reference number
6. Wait for barangay staff to contact you for follow-up
7. Attend mediation/hearing if scheduled
8. Follow up on your complaint status online or in person""",
                'required_documents': "Valid ID, Supporting evidence (photos/videos), Witness statements (if any)",
                'estimated_timeline': "Initial response within 24 hours, Full resolution within 7-30 days",
            },
            {
                'situation_type': 'document',
                'title': 'Barangay Clearance Request',
                'description': 'Step-by-step guide for requesting a barangay clearance',
                'recommended_steps': """1. Prepare all required documents
2. Visit barangay hall during office hours (Mon-Fri, 8AM-5PM)
3. Get application form from the counter
4. Fill out the form completely and accurately
5. Submit form with requirements
6. Pay the processing fee (₱50)
7. Receive your claim stub
8. Return after 1-2 business days to claim your clearance""",
                'required_documents': "Valid government-issued ID, Proof of residency, 1x1 ID photo, Cedula (Community Tax Certificate)",
                'estimated_timeline': "1-2 business days",
            },
            {
                'situation_type': 'business',
                'title': 'Business Permit Application',
                'description': 'Complete guide for applying for a business permit',
                'recommended_steps': """1. Register your business name (DTI for sole proprietorship)
2. Secure barangay clearance
3. Prepare location plan/sketch of your business
4. Get Fire Safety Inspection Certificate
5. Get Sanitary Permit (for food businesses)
6. Submit all documents to barangay hall
7. Pay processing fees
8. Wait for inspection (if required)
9. Claim your business permit after approval""",
                'required_documents': "DTI/SEC Registration, Barangay Clearance, Location Plan, Contract of Lease, Valid ID, Fire Safety Certificate, Sanitary Permit (for food)",
                'estimated_timeline': "3-5 business days after submission of complete requirements",
            },
            {
                'situation_type': 'dispute',
                'title': 'Neighbor Dispute Resolution',
                'description': 'How to resolve conflicts with neighbors through barangay mediation',
                'recommended_steps': """1. Try to resolve the issue amicably first (talk to your neighbor)
2. If unsuccessful, file a complaint at the barangay
3. Barangay will summon both parties for mediation (Katarungang Pambarangay)
4. Attend the scheduled mediation session
5. Present your side calmly and respectfully
6. Listen to the other party's perspective
7. Work with the Lupon to reach an agreement
8. Sign the settlement agreement if resolved
9. If no settlement, case may be referred to higher authorities""",
                'required_documents': "Valid ID, Evidence of the dispute (if any), Witness statements",
                'estimated_timeline': "First mediation within 7 days, Multiple sessions may be needed",
            }
        ]
        
        template_count = 0
        for situation_data in sample_situations:
            template, created = SituationTemplate.objects.get_or_create(
                title=situation_data['title'],
                defaults=situation_data
            )
            if created:
                template_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'[OK] Created {template_count} new situation templates'))
        
        self.stdout.write(self.style.SUCCESS('\n[SUCCESS] AI Captain initialization complete!'))
        self.stdout.write(self.style.SUCCESS('You can now use the AI Virtual Barangay Captain feature.'))

