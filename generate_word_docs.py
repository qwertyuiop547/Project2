"""
Word (.docx) documentation generator for the Barangay Burgos Django Web Portal.
"""
import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls


def set_cell_bg(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)


def set_cell_pad(cell, top=80, bottom=80, left=120, right=120):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top}" w:type="dxa"/>
            <w:bottom w:w="{bottom}" w:type="dxa"/>
            <w:left w:w="{left}" w:type="dxa"/>
            <w:right w:w="{right}" w:type="dxa"/>
        </w:tcMar>''')
    tcPr.append(tcMar)


def build_doc():
    doc = Document()

    # Page margins
    for sec in doc.sections:
        sec.top_margin = Inches(1.0)
        sec.bottom_margin = Inches(1.0)
        sec.left_margin = Inches(1.0)
        sec.right_margin = Inches(1.0)

    # Color palette
    NAVY    = RGBColor(15,  23,  42)
    EMERALD = RGBColor(5,  150, 105)
    BLUE    = RGBColor(30,  58, 138)
    GRAY    = RGBColor(100,116, 139)
    TEXT    = RGBColor(30,  41,  59)
    WHITE   = RGBColor(255,255, 255)

    doc.styles['Normal'].font.name = 'Segoe UI'
    doc.styles['Normal'].font.size = Pt(10)
    doc.styles['Normal'].font.color.rgb = TEXT

    # ── Helper utilities ────────────────────────────────────────────────────
    def h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after  = Pt(5)
        r = p.add_run(text)
        r.font.size = Pt(15); r.font.bold = True; r.font.color.rgb = NAVY

    def h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after  = Pt(3)
        r = p.add_run(text)
        r.font.size = Pt(12); r.font.bold = True; r.font.color.rgb = EMERALD

    def h3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(7)
        p.paragraph_format.space_after  = Pt(2)
        r = p.add_run(text)
        r.font.size = Pt(10.5); r.font.bold = True; r.font.color.rgb = BLUE

    def body(text):
        p = doc.add_paragraph(text)
        p.paragraph_format.space_after = Pt(4)

    def bullet(bold_part, rest):
        p = doc.add_paragraph()
        p.style = 'List Bullet'
        p.paragraph_format.space_after = Pt(2)
        r1 = p.add_run(bold_part)
        r1.font.bold = True; r1.font.color.rgb = NAVY
        r2 = p.add_run(rest)
        r2.font.color.rgb = TEXT

    def table_header(tbl, headers, bg="1E3A8A"):
        row = tbl.rows[0]
        for i, h in enumerate(headers):
            c = row.cells[i]
            c.text = h
            set_cell_bg(c, bg)
            set_cell_pad(c)
            run = c.paragraphs[0].runs[0]
            run.font.bold = True; run.font.color.rgb = WHITE; run.font.size = Pt(9)

    def table_row(tbl, row_idx, values, alt=False):
        row = tbl.rows[row_idx]
        for col_idx, val in enumerate(values):
            c = row.cells[col_idx]
            c.text = val
            set_cell_bg(c, "F8FAFC" if alt else "FFFFFF")
            set_cell_pad(c, top=60, bottom=60, left=100, right=100)
            c.paragraphs[0].runs[0].font.size = Pt(8.5)

    def callout(heading, text, bg="ECFDF5", color=None):
        tbl = doc.add_table(rows=1, cols=1)
        c = tbl.rows[0].cells[0]
        set_cell_bg(c, bg)
        set_cell_pad(c, top=100, bottom=100, left=140, right=140)
        p = c.paragraphs[0]
        r1 = p.add_run(heading + "\n")
        r1.font.bold = True; r1.font.size = Pt(9.5)
        r1.font.color.rgb = color or EMERALD
        r2 = p.add_run(text)
        r2.font.size = Pt(9)

    # ── COVER ───────────────────────────────────────────────────────────────
    p = doc.add_paragraph()
    r = p.add_run("REPUBLIC OF THE PHILIPPINES  •  BARANGAY BURGOS  •  OFFICIAL DIGITAL PORTAL")
    r.font.size = Pt(9); r.font.bold = True; r.font.color.rgb = EMERALD
    p.paragraph_format.space_after = Pt(2)

    p = doc.add_paragraph()
    r = p.add_run("Barangay Burgos e-Governance & AI-Powered Community Portal")
    r.font.size = Pt(22); r.font.bold = True; r.font.color.rgb = NAVY
    p.paragraph_format.space_after = Pt(3)

    p = doc.add_paragraph()
    r = p.add_run("Comprehensive Full-System Technical Documentation — Version 1.0")
    r.font.size = Pt(12); r.font.color.rgb = BLUE
    p.paragraph_format.space_after = Pt(14)

    # Metadata table
    mt = doc.add_table(rows=4, cols=2); mt.autofit = False
    meta = [
        ("System Type:",   "Django 4.x Full-Stack Web Application (MVC Architecture)"),
        ("Live URL:",       "https://project2-g69i.onrender.com/"),
        ("Repository:",    "https://github.com/qwertyuiop547/Project2.git"),
        ("Documentation:", "Version 1.0 — Full System Specification (2026)"),
    ]
    for i, (lbl, val) in enumerate(meta):
        mt.rows[i].cells[0].text = lbl
        mt.rows[i].cells[0].paragraphs[0].runs[0].font.bold = True
        mt.rows[i].cells[1].text = val
        for c in mt.rows[i].cells:
            set_cell_bg(c, "F1F5F9"); set_cell_pad(c, 60, 60, 100, 100)
            c.paragraphs[0].runs[0].font.size = Pt(9)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # ════════════════════════════════════════════════════════════════════════
    # 1. SYSTEM OVERVIEW
    # ════════════════════════════════════════════════════════════════════════
    h1("1. System Overview & Purpose")
    body(
        "The Barangay Burgos e-Governance Portal is a full-stack web application built with the "
        "Django framework (Python). It digitizes the end-to-end administrative operations of a Philippine "
        "barangay unit, replacing paper logbooks and walk-in queues with secure, 24/7 online services. "
        "Citizens can file complaints, request official documents, submit community suggestions, and interact "
        "with an AI Virtual Captain — all from any device."
    )
    body(
        "Officials (Secretary, Chairman) manage cases, issue certificates, publish announcements, "
        "send direct messages, and view real-time analytics through a dedicated governance dashboard."
    )

    h2("1.1 Technology Stack")
    bullet("Web Framework: ", "Django 4.2 (Python) — MVC architecture with class-based views and Django ORM.")
    bullet("Database: ", "SQLite (development) and PostgreSQL (production via psycopg2 + dj-database-url).")
    bullet("Frontend Rendering: ", "Django Templates (Jinja2-like) with Bootstrap 5, Crispy Forms, and custom CSS/JS.")
    bullet("Static File Serving: ", "WhiteNoise middleware for compressed static asset delivery in production.")
    bullet("AI Integration: ", "OpenAI API (GPT models) via the ai_captain app for the Virtual Barangay Captain chatbot.")
    bullet("Internationalization: ", "Django i18n with locale support (English and Filipino/Tagalog).")
    bullet("REST API Layer: ", "Django REST Framework (DRF) for API endpoints consumed by frontend JS and external integrations.")
    bullet("Authentication: ", "Django's built-in session-based authentication with a custom AbstractUser model.")
    bullet("Deployment: ", "Gunicorn WSGI server on Render cloud platform with PostgreSQL add-on.")

    # ════════════════════════════════════════════════════════════════════════
    # 2. PROJECT DIRECTORY STRUCTURE
    # ════════════════════════════════════════════════════════════════════════
    h1("2. Project Structure & Django Apps")
    body("The project follows standard Django app-based architecture. Each domain has its own dedicated app:")

    tbl = doc.add_table(rows=14, cols=3)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_header(tbl, ["App / Directory", "Purpose & Responsibility", "Key Files"])
    rows = [
        ("accounts/", "Custom user model, login, registration, role management, residency validation.", "models.py, views.py, urls.py, forms.py"),
        ("complaints/", "Citizen complaint submission, status workflow, attachments, officer assignment, anonymous filing.", "models.py, views.py, forms.py"),
        ("ai_captain/", "AI Virtual Barangay Captain: conversations, messages, policies, situation templates, personality config.", "models.py, views.py, urls.py"),
        ("analytics/", "Governance analytics dashboard: complaint stats, resolution rates, trend charts.", "views.py, urls.py"),
        ("announcements/", "Official barangay broadcasts, public advisories, and emergency alerts.", "models.py, views.py"),
        ("dashboard/", "Resident & official personalized dashboards with KPI summaries.", "views.py, urls.py"),
        ("direct_messages/", "Internal messaging between residents and officials.", "models.py, views.py"),
        ("feedback/", "Post-resolution resident feedback and satisfaction rating system.", "models.py, views.py"),
        ("gallery/", "Barangay photo gallery and media content management.", "models.py, views.py"),
        ("home/", "Public homepage: services overview, statistics, hotlines, news feed.", "views.py, urls.py"),
        ("notifications/", "Real-time in-app notification system for users and officials.", "models.py, views.py"),
        ("services/", "Barangay service catalog: clearances, certificates, permits, fees, requirements.", "models.py, views.py"),
        ("suggestions/", "Community idea portal: citizen proposals and upvoting/endorsement.", "models.py, views.py"),
    ]
    for i, r in enumerate(rows):
        table_row(tbl, i + 1, r, alt=(i % 2 == 1))

    # ════════════════════════════════════════════════════════════════════════
    # 3. USER ROLES & ACCESS CONTROL
    # ════════════════════════════════════════════════════════════════════════
    h1("3. User Roles & Access Control")
    body(
        "The system uses Django's session authentication with a custom AbstractUser model "
        "(accounts.CustomUser). Three operational roles are enforced across all views:"
    )

    tbl2 = doc.add_table(rows=4, cols=3); tbl2.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_header(tbl2, ["Role", "Target Users", "System Capabilities"])
    role_rows = [
        ("RESIDENT", "Barangay citizens and constituents",
         "Self-register, submit complaints (named or anonymous), request clearances, submit suggestions, chat with AI Captain, view personal notifications, track filings, rate resolved cases."),
        ("SECRETARY", "Barangay Secretary & administrative staff",
         "Review and update complaints, issue official certificates, manage announcements, handle service requests, send direct messages, moderate suggestions."),
        ("CHAIRMAN", "Punong Barangay (Captain)",
         "Full governance dashboard, analytics access, Lupon dispute oversight, approve/reject user accounts, view anonymous complaint identities, manage policies for the AI Captain."),
    ]
    for i, r in enumerate(role_rows):
        table_row(tbl2, i + 1, r, alt=(i % 2 == 1))

    body("")
    bullet("Account Approval Workflow: ", "New resident registrations require manual approval by the Chairman or Secretary before the account is activated.")
    bullet("Superuser Access: ", "Django superusers are treated as Chairman-level officials via the is_chairman() method and have full admin panel access.")
    bullet("Anonymous Complaints: ", "Residents can file without revealing identity. Anonymous identity is visible only to Chairman-level officials (can_view_anonymous_identity()).")

    # ════════════════════════════════════════════════════════════════════════
    # 4. DATABASE SCHEMA & DATA DICTIONARY
    # ════════════════════════════════════════════════════════════════════════
    h1("4. Database Schema & Data Dictionary")
    body("Key models across the Django apps and their significant fields:")

    h2("4.1 accounts.CustomUser (extends AbstractUser)")
    tbl3 = doc.add_table(rows=9, cols=3); tbl3.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_header(tbl3, ["Field", "Type", "Purpose"])
    user_fields = [
        ("role", "CharField (resident/secretary/chairman)", "Determines permissions and dashboard routing."),
        ("phone_number", "CharField", "Contact number for official communications."),
        ("profile_photo", "ImageField", "User avatar stored in /profile_photos/."),
        ("is_approved", "BooleanField", "Account active only after official approval."),
        ("latitude / longitude", "DecimalField", "GPS coordinates for residency geolocation validation."),
        ("residency_validation_score", "IntegerField", "Score from automated address verification."),
        ("is_deactivated", "BooleanField", "Soft-delete flag to disable accounts without data loss."),
        ("verification_document", "FileField", "Uploaded ID or residence proof for account approval."),
    ]
    for i, r in enumerate(user_fields):
        table_row(tbl3, i + 1, r, alt=(i % 2 == 1))

    h2("4.2 complaints.Complaint")
    tbl4 = doc.add_table(rows=10, cols=3); tbl4.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_header(tbl4, ["Field", "Type", "Purpose"])
    comp_fields = [
        ("title / description", "CharField / TextField", "Complaint subject and full narrative."),
        ("category", "FK → ComplaintCategory", "Classification (Infrastructure, Sanitation, Noise, etc.)."),
        ("status", "CharField (6 choices)", "pending → under_review → in_progress → resolved → closed / rejected."),
        ("priority", "CharField (low/medium/high/urgent)", "Urgency level set by resident or escalated by officials."),
        ("is_anonymous / anonymous_reference", "BooleanField / CharField", "Enables privacy-protected filing with unique tracking reference."),
        ("assigned_to", "FK → CustomUser", "Official assigned to resolve the case."),
        ("estimated_resolution_date", "DateField", "ETA committed by the barangay."),
        ("rating / rating_feedback", "IntegerField (1–5) / TextField", "Post-resolution resident satisfaction score."),
        ("chairman_notes / resolution_notes", "TextField", "Internal notes visible only to officials."),
    ]
    for i, r in enumerate(comp_fields):
        table_row(tbl4, i + 1, r, alt=(i % 2 == 1))

    h2("4.3 ai_captain Models")
    tbl5 = doc.add_table(rows=6, cols=3); tbl5.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_header(tbl5, ["Model", "Key Fields", "Purpose"])
    ai_models = [
        ("Conversation", "session_id, user, is_active, satisfaction_rating, conversation_topic", "Each chat session between a user and the AI Captain."),
        ("Message", "user_message, captain_response, intent_detected, confidence_score, was_helpful", "Individual message exchange with AI metadata."),
        ("PolicyDocument", "title, category, content, summary, keywords, ordinance_number", "Barangay policy and ordinance knowledge base for AI context."),
        ("SituationTemplate", "situation_type, recommended_steps, required_documents, estimated_timeline", "Step-by-step guidance templates for common citizen scenarios."),
        ("CaptainPersonality", "name, system_prompt, tone, language_style, empathy_level", "Configurable AI persona settings (name, language, system prompt)."),
    ]
    for i, r in enumerate(ai_models):
        table_row(tbl5, i + 1, r, alt=(i % 2 == 1))

    # ════════════════════════════════════════════════════════════════════════
    # 5. AI CAPTAIN — DEEP DIVE
    # ════════════════════════════════════════════════════════════════════════
    h1("5. AI Virtual Barangay Captain — Deep Dive")
    body(
        "The ai_captain app integrates OpenAI's GPT API to provide an intelligent, conversational virtual "
        "assistant styled as 'Kapitan AI'. Citizens can interact in natural Tagalog, English, or Taglish. "
        "The AI provides step-by-step guidance, fee information, document requirements, and links to barangay policies."
    )

    h2("5.1 AI Architecture")
    bullet("OpenAI GPT API: ", "Processes citizen queries and generates contextually relevant responses.")
    bullet("Knowledge Base (PolicyDocument): ", "Officials can load barangay ordinances, resolutions, and FAQs into the AI knowledge base. These are injected into the AI system prompt for accurate, policy-grounded answers.")
    bullet("Situation Templates: ", "Pre-built guidance flows for common resident situations (complaint filing, document requests, business permits, neighbor disputes, emergency situations, social welfare).")
    bullet("Configurable Personality (CaptainPersonality): ", "Admins can adjust the AI's name, tone (professional/friendly), language style (English/Tagalog/mixed), empathy level (1–5), and the full system prompt without code changes.")
    bullet("Conversation Tracking: ", "All sessions (Conversation) and individual exchanges (Message) are stored for audit, quality review, and satisfaction analytics.")

    h2("5.2 AI Captain Communication Style")
    callout(
        "Default System Prompt Excerpt (from CaptainPersonality.system_prompt):",
        "You are *Kapitan AI*, the Virtual Barangay Captain for a Philippine barangay community.\n"
        "• Use natural Taglish (mix of Filipino and English) for authenticity.\n"
        "• Sound warm, approachable, and trustworthy — like a real barangay captain.\n"
        "• Give clear, numbered steps with timelines when explaining processes.\n"
        "• Include practical details: fees, required documents, office hours, processing times.\n"
        "• Mention who to approach and where to go (office name, window/desk, or online option).\n"
        "• Goal: make barangay services simple and less intimidating for residents."
    )

    # ════════════════════════════════════════════════════════════════════════
    # 6. CORE MODULES
    # ════════════════════════════════════════════════════════════════════════
    h1("6. Core Application Modules")

    h2("6.1 Home ('/')")
    bullet("Public landing page: ", "Displays the barangay name, mission, statistics, featured services, latest announcements, photo gallery preview, and emergency hotlines.")
    bullet("No login required: ", "Fully accessible by any visitor to maximize public information reach.")

    h2("6.2 Accounts ('/accounts/')")
    bullet("Registration: ", "Residents self-register with name, address, phone, and upload an optional verification document (valid ID or proof of residence).")
    bullet("Approval Workflow: ", "Officials review pending registrations and either approve (activating the account) or reject (with a stated reason).")
    bullet("Residency Validation: ", "Optional GPS-based and document-based validation to confirm the resident actually lives within barangay boundaries.")
    bullet("Login History Tracking: ", "Every login event (IP address, device info, session key, timestamps) is stored for security auditing and suspicious activity detection.")

    h2("6.3 Complaints ('/complaints/')")
    bullet("Structured Filing: ", "Residents choose a category, describe the issue, set priority, optionally attach photos/files, and submit.")
    bullet("Anonymous Mode: ", "The system generates a unique 10-character reference code enabling anonymous tracking without exposing the filer's identity.")
    bullet("6-Stage Status Workflow: ", "pending → under_review → in_progress → resolved → closed / rejected.")
    bullet("Officer Assignment: ", "Cases are assignable to specific officials for accountability tracking.")
    bullet("Status History: ", "Every status change is logged (ComplaintStatusHistory) with the responsible official and notes — creating a complete audit trail.")
    bullet("Post-Resolution Rating: ", "Once resolved, residents rate their satisfaction (1–5 stars) and leave feedback.")

    h2("6.4 AI Captain ('/ai-captain/')")
    body("Citizens can start a conversation with the AI Virtual Captain. The AI draws on the PolicyDocument knowledge base and SituationTemplates to provide accurate, step-by-step guidance on:")
    bullet("Filing complaints and documents: ", "What category to choose, what documents to bring, estimated timelines.")
    bullet("Understanding ordinances: ", "Plain-language explanations of barangay policies.")
    bullet("Emergency guidance: ", "Step-by-step instructions for emergency situations.")
    bullet("Permit and clearance procedures: ", "Complete requirements, fees, and processing timelines.")

    h2("6.5 Services ('/services/')")
    bullet("Service Catalog: ", "Lists all available barangay certificates and clearances (Barangay Clearance, Indigency Certificate, Business Permit, etc.).")
    bullet("Transparent fees & requirements: ", "Each service displays exact processing fees, estimated release days, and required documents.")

    h2("6.6 Suggestions ('/suggestions/')")
    bullet("Community Proposals: ", "Residents submit ideas for barangay improvements with title, description, and category tags.")
    bullet("Public Upvoting: ", "The community endorses popular ideas, surfacing high-priority initiatives to barangay leadership.")

    h2("6.7 Announcements ('/announcements/')")
    bullet("Official Broadcasts: ", "Barangay Secretary or Chairman posts public advisories, event notices, and emergency alerts.")
    bullet("Urgency Flagging: ", "Announcements can be marked as urgent for prominence in the homepage feed.")

    h2("6.8 Direct Messages ('/messages/')")
    bullet("Resident-to-Official Messaging: ", "Secure, direct in-app messaging between residents and barangay officials for private case follow-ups.")

    h2("6.9 Notifications ('/notifications/')")
    bullet("In-App Alerts: ", "Real-time notifications delivered to users on status changes, new messages, announcements, and complaint updates.")

    h2("6.10 Gallery ('/gallery/')")
    bullet("Media Library: ", "Barangay photo gallery and event documentation for community transparency and engagement.")

    h2("6.11 Analytics ('/analytics/')")
    bullet("Governance Dashboard: ", "Visual charts and KPI metrics for complaint resolution rates, category breakdowns, monthly trends, and officer performance — visible to officials only.")

    # ════════════════════════════════════════════════════════════════════════
    # 7. URL STRUCTURE
    # ════════════════════════════════════════════════════════════════════════
    h1("7. URL Structure & Routing")
    body("All URLs are localized via Django's i18n_patterns (supports both English and Filipino language prefixes):")

    tbl6 = doc.add_table(rows=13, cols=2); tbl6.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_header(tbl6, ["URL Prefix", "App Module"])
    url_rows = [
        ("/",                    "home — Public homepage"),
        ("/accounts/",           "accounts — Registration, login, profile, approval"),
        ("/dashboard/",          "dashboard — Resident & official personalized dashboards"),
        ("/complaints/",         "complaints — File, track, and manage incidents"),
        ("/ai-captain/",         "ai_captain — AI Virtual Barangay Captain chatbot"),
        ("/announcements/",      "announcements — Official bulletins and public advisories"),
        ("/gallery/",            "gallery — Community photo gallery"),
        ("/suggestions/",        "suggestions — Community idea portal"),
        ("/services/",           "services — Service catalog and clearance applications"),
        ("/notifications/",      "notifications — In-app notification center"),
        ("/messages/",           "direct_messages — Resident-official secure messaging"),
        ("/analytics/",          "analytics — Governance KPI and trend charts (officials only)"),
    ]
    for i, r in enumerate(url_rows):
        table_row(tbl6, i + 1, r, alt=(i % 2 == 1))

    # ════════════════════════════════════════════════════════════════════════
    # 8. SETUP & DEPLOYMENT
    # ════════════════════════════════════════════════════════════════════════
    h1("8. Setup, Configuration & Deployment")

    h2("8.1 Environment Variables (.env)")
    bullet("SECRET_KEY: ", "Django cryptographic secret key.")
    bullet("DEBUG: ", "True (development) or False (production).")
    bullet("ALLOWED_HOSTS: ", "Comma-separated list of allowed host headers.")
    bullet("DATABASE_URL: ", "PostgreSQL connection URI (auto-parsed by dj-database-url).")
    bullet("OPENAI_API_KEY: ", "API key for the AI Captain GPT integration.")
    bullet("RENDER_EXTERNAL_HOSTNAME: ", "Set automatically by Render for production CSRF and host configuration.")

    h2("8.2 Local Development Commands")
    bullet("Create virtual environment: ", "python -m venv .venv && .venv\\Scripts\\activate")
    bullet("Install dependencies: ", "pip install -r requirements.txt")
    bullet("Run database migrations: ", "python manage.py migrate")
    bullet("Start development server: ", "python manage.py runserver")

    h2("8.3 Production Deployment (Render)")
    bullet("Web Service Type: ", "Python (Gunicorn WSGI server).")
    bullet("Build Command: ", "pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate")
    bullet("Start Command: ", "gunicorn core.wsgi:application")
    bullet("Static Files: ", "WhiteNoise serves compressed static files directly from Gunicorn.")
    bullet("Database: ", "Render PostgreSQL add-on (psycopg2-binary + dj-database-url).")

    # ════════════════════════════════════════════════════════════════════════
    # 9. SECURITY FEATURES
    # ════════════════════════════════════════════════════════════════════════
    h1("9. Security Features & Data Protection")
    bullet("CSRF Protection: ", "Django CSRF middleware active on all POST forms and configured for production domains.")
    bullet("XFrameOptions: ", "Clickjacking protection via X-Frame-Options headers.")
    bullet("Session Authentication: ", "Django session-based auth with hashed passwords (PBKDF2 + SHA256).")
    bullet("Login History Auditing: ", "IP address, device fingerprint, and session key logged for every login event.")
    bullet("Suspicious Login Flagging: ", "is_suspicious flag on LoginHistory for security review.")
    bullet("Account Deactivation: ", "Soft-delete pattern (is_deactivated) avoids permanent data loss while blocking access.")
    bullet("Anonymous Filing Protection: ", "Anonymous complaint identity visible only to Chairman-level officials via can_view_anonymous_identity().")

    # ── FOOTER ───────────────────────────────────────────────────────────────
    doc.add_paragraph().paragraph_format.space_before = Pt(24)
    p = doc.add_paragraph()
    r = p.add_run("Barangay Burgos Digital Governance System  •  Official System Documentation  •  2026")
    r.font.size = Pt(9); r.font.color.rgb = GRAY
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    return doc


if __name__ == "__main__":
    out = (
        r"c:\Users\alice\OneDrive\Documents\Project2-main"
        r"\BARANGAY_PORTAL_DOCUMENTATION.docx"
    )
    doc = build_doc()
    doc.save(out)
    print(f"[SUCCESS] Documentation saved: {out}")
