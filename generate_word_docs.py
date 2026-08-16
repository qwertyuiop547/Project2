import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top}" w:type="dxa"/>
            <w:bottom w:w="{bottom}" w:type="dxa"/>
            <w:left w:w="{left}" w:type="dxa"/>
            <w:right w:w="{right}" w:type="dxa"/>
        </w:tcMar>
    ''')
    tcPr.append(tcMar)

def create_document():
    doc = Document()
    
    # Page setup - Normal Margins (1 inch)
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Styles & Colors
    NAVY = RGBColor(15, 23, 42)       # #0f172a
    EMERALD = RGBColor(5, 150, 105)   # #059669
    DARK_BLUE = RGBColor(30, 58, 138) # #1e3a8a
    GRAY = RGBColor(100, 116, 139)    # #64748b
    TEXT_COLOR = RGBColor(30, 41, 59) # #1e293b

    # Base Normal Style
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Segoe UI'
    style_normal.font.size = Pt(10.5)
    style_normal.font.color.rgb = TEXT_COLOR

    # --- COVER / HEADER BANNER ---
    p_kicker = doc.add_paragraph()
    r_kicker = p_kicker.add_run("REPUBLIC OF THE PHILIPPINES • BARANGAY BURGOS")
    r_kicker.font.size = Pt(9.5)
    r_kicker.font.bold = True
    r_kicker.font.color.rgb = EMERALD
    p_kicker.paragraph_format.space_after = Pt(2)

    p_title = doc.add_paragraph()
    r_title = p_title.add_run("Barangay Burgos e-Services & AI Governance Portal")
    r_title.font.size = Pt(24)
    r_title.font.bold = True
    r_title.font.color.rgb = NAVY
    p_title.paragraph_format.space_after = Pt(4)

    p_subtitle = doc.add_paragraph()
    r_sub = p_subtitle.add_run("Comprehensive System Architecture, Modules & AI Features Documentation")
    r_sub.font.size = Pt(13)
    r_sub.font.color.rgb = DARK_BLUE
    p_subtitle.paragraph_format.space_after = Pt(14)

    # Metadata Box
    meta_table = doc.add_table(rows=2, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_table.autofit = False

    cells = meta_table.rows[0].cells
    cells[0].text = "Live Production URL:"
    cells[0].paragraphs[0].runs[0].font.bold = True
    cells[1].text = "https://barangay-portal-jqxc.onrender.com/"
    
    cells2 = meta_table.rows[1].cells
    cells2[0].text = "Source Code Repository:"
    cells2[0].paragraphs[0].runs[0].font.bold = True
    cells2[1].text = "https://github.com/qwertyuiop547/Project2.git"

    for row in meta_table.rows:
        for cell in row.cells:
            set_cell_background(cell, "F1F5F9")
            set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
            for p in cell.paragraphs:
                for r in p.runs:
                    r.font.size = Pt(9.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Heading Helpers
    def add_heading_1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        r = p.add_run(text)
        r.font.size = Pt(16)
        r.font.bold = True
        r.font.color.rgb = NAVY
        return p

    def add_heading_2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        r = p.add_run(text)
        r.font.size = Pt(13)
        r.font.bold = True
        r.font.color.rgb = EMERALD
        return p

    def add_bullet(p, bold_prefix, text):
        p.style = 'List Bullet'
        p.paragraph_format.space_after = Pt(3)
        r1 = p.add_run(bold_prefix)
        r1.font.bold = True
        r1.font.color.rgb = NAVY
        r2 = p.add_run(text)
        r2.font.color.rgb = TEXT_COLOR

    # --- SECTION 1: EXECUTIVE SUMMARY ---
    add_heading_1("1. Executive Summary & Architecture Overview")
    doc.add_paragraph(
        "The Barangay Burgos Digital Governance Portal is an enterprise full-stack web application designed to digitize, "
        "streamline, and modernize local government services in the Philippines. It replaces physical counter queues and paper-heavy workflows "
        "with an automated, 24/7 digital self-service platform integrated with artificial intelligence (AI)."
    )

    doc.add_paragraph("Full-Stack Technology Stack Architecture:").paragraph_format.space_after = Pt(2)
    doc.paragraphs[-1].runs[0].font.bold = True

    add_bullet(doc.add_paragraph(), "Frontend Client Application: ", "React 18 Single-Page Application (SPA) powered by Vite 5, Zustand for client-side state management, TanStack React Query for data synchronization, Lucide React icons, and a custom Clean Civic Light CSS design system.")
    add_bullet(doc.add_paragraph(), "Backend API Server: ", "Node.js with Express 4 REST API, JSON Web Token (JWT) stateless authentication, Bcrypt password encryption, Express Validator, and Server-Sent Events (SSE) for real-time AI token streaming.")
    add_bullet(doc.add_paragraph(), "Database & Persistence Layer: ", "Managed PostgreSQL database orchestrated via Prisma 5 ORM with strict relational schema modeling, connection pooling, and automated database seeding.")
    add_bullet(doc.add_paragraph(), "AI Intelligence Layer: ", "Multi-provider AI pipeline supporting Ollama (Local Open-Source LLM), Google Gemini API, Groq, OpenAI, and a built-in zero-dependency Natural Language Processing (NLP) rule engine.")

    # --- SECTION 2: USER ROLES ---
    add_heading_1("2. Role-Based Access Control (RBAC)")
    doc.add_paragraph("The application enforces strict Role-Based Access Control across three core operational personas:")

    role_table = doc.add_table(rows=4, cols=3)
    role_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    role_headers = ["Role", "Target Persona", "System Capabilities & Permissions"]
    for i, title in enumerate(role_headers):
        cell = role_table.rows[0].cells[i]
        cell.text = title
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
        p = cell.paragraphs[0]
        p.runs[0].font.bold = True
        p.runs[0].font.color.rgb = RGBColor(255, 255, 255)
        p.runs[0].font.size = Pt(10)

    roles_data = [
        ("RESIDENT", "Barangay Citizens & Constituents", "File complaints using the AI Complaint Assistant, apply for official certificates and clearances, submit community suggestions, interact with the Barangay AI Chatbot, and track real-time filing progress on their dashboard."),
        ("SECRETARY", "Barangay Secretary & Administrative Staff", "Review incoming citizen complaints, update dispute statuses and issue official remarks, process and approve document applications, and publish official public announcements."),
        ("CHAIRMAN", "Punong Barangay / Barangay Captain", "Access high-level municipal governance analytics, review case resolution rates, manage escalated disputes (Lupon Tagapamayapa mediation), and oversee administrative operations.")
    ]

    for row_idx, (role_name, users_target, perms) in enumerate(roles_data, start=1):
        row = role_table.rows[row_idx]
        row.cells[0].text = role_name
        row.cells[1].text = users_target
        row.cells[2].text = perms
        for col_idx, cell in enumerate(row.cells):
            set_cell_background(cell, "FFFFFF" if row_idx % 2 == 1 else "F8FAFC")
            set_cell_margins(cell, top=90, bottom=90, left=120, right=120)
            p = cell.paragraphs[0]
            p.runs[0].font.size = Pt(9.5)
            if col_idx == 0:
                p.runs[0].font.bold = True

    # Pre-seeded Accounts
    p_acc = doc.add_paragraph()
    p_acc.paragraph_format.space_before = Pt(8)
    p_acc.add_run("Pre-Seeded Demo Accounts for Testing:").font.bold = True
    add_bullet(doc.add_paragraph(), "Resident: ", "resident@example.com | password: password123")
    add_bullet(doc.add_paragraph(), "Secretary: ", "secretary@barangay.gov.ph | password: password123")
    add_bullet(doc.add_paragraph(), "Chairman: ", "chairman@barangay.gov.ph | password: password123")

    # --- SECTION 3: AI FEATURES ---
    add_heading_1("3. 🤖 Deep Dive: AI-Powered Governance Features")
    doc.add_paragraph(
        "A cornerstone of the platform is its multi-tiered Artificial Intelligence subsystem, engineered specifically for "
        "Philippine local governance workflows. It ensures high reliability, privacy, and zero downtime regardless of cloud API availability."
    )

    add_heading_2("3.1 Multi-Provider AI Architecture with Resilient Fallback")
    doc.add_paragraph(
        "The AI service layer ('server/src/services/ai.js') evaluates active AI providers in dynamic priority order:"
    )
    add_bullet(doc.add_paragraph(), "1. Ollama (Local Private LLM): ", "Connects to local open-source models (e.g., Llama 3.2 1B/3B, Mistral). Free, zero token cost, and ensures complete citizen data privacy within the server perimeter.")
    add_bullet(doc.add_paragraph(), "2. Google Gemini API: ", "High-speed cloud generative intelligence enabled when GEMINI_API_KEY is supplied.")
    add_bullet(doc.add_paragraph(), "3. Groq & OpenAI APIs: ", "Ultra-low-latency alternative cloud inference engines.")
    add_bullet(doc.add_paragraph(), "4. Smart Assist Engine (Zero-Dependency Fallback): ", "When no LLM or internet connection is active, the built-in rule engine autonomously processes Tagalog text, keyword stemming, and report structuring without failing.")

    add_heading_2("3.2 AI Complaint Assistant & Auto-Refinement")
    doc.add_paragraph(
        "Citizens often describe incidents in emotional, informal, or fragmented Tagalog/Taglish. "
        "The AI Complaint Assistant automatically refines raw descriptions into structured, formal municipal reports:"
    )
    add_bullet(doc.add_paragraph(), "Automatic Categorization: ", "Accurately classifies reports into Infrastructure, Sanitation, Public Safety, Noise & Disturbance, or Others.")
    add_bullet(doc.add_paragraph(), "Hazard-Based Priority Scoring: ", "Assigns urgency levels (URGENT, HIGH, MEDIUM, LOW) based on safety hazards (e.g., floods, fire, open electrical wires, robbery).")
    add_bullet(doc.add_paragraph(), "Formal Tagalog Synthesis: ", "Polishes colloquial sentences into courteous, professional Tagalog suitable for barangay hearings and permanent official records.")
    add_bullet(doc.add_paragraph(), "Fact Preservation Guarantee: ", "Preserves all landmarks, dates, and locations without hallucinating false details.")

    # Callout Box Example
    callout = doc.add_table(rows=1, cols=1)
    c_cell = callout.rows[0].cells[0]
    set_cell_background(c_cell, "ECFDF5")
    set_cell_margins(c_cell, top=120, bottom=120, left=180, right=180)
    cp = c_cell.paragraphs[0]
    cr1 = cp.add_run("💡 Example of AI Complaint Refinement:\n")
    cr1.font.bold = True
    cr1.font.color.rgb = EMERALD
    cr2 = cp.add_run(
        "• Raw Resident Input: \"may butas kalsada tapat ng tindahan ni aling nena delikado sa motor baha pa\"\n"
        "• AI Polished Title: \"Lubak at Pagbaha sa Kalsada sa Purok 3\"\n"
        "• AI Formal Description: \"Nais kong i-report ang malaking butas sa kalsada sa tapat ng Nena Store na nagdudulot ng panganib sa mga nagmomotor at nagiging sanhi ng pagbaha. Humihiling po kami ng agarang aksyon mula sa barangay.\"\n"
        "• Category: Infrastructure | Priority: HIGH"
    )
    cr2.font.size = Pt(9.5)

    add_heading_2("3.3 AI Barangay Chatbot (Real-Time SSE Streaming)")
    doc.add_paragraph(
        "Accessible on every page, the Barangay AI Assistant assists citizens in real-time:"
    )
    add_bullet(doc.add_paragraph(), "Real-Time Token Streaming: ", "Outputs tokens incrementally via Server-Sent Events (SSE) for a smooth typewriter effect.")
    add_bullet(doc.add_paragraph(), "Context-Aware Knowledge Injection: ", "Injects up-to-date barangay service fees, processing days, document requirements, and the resident's active filed complaints.")
    add_bullet(doc.add_paragraph(), "Bilingual Communication: ", "Fluent in Tagalog, English, and Taglish with respectful Filipino honorifics ('Po/Opo').")
    add_bullet(doc.add_paragraph(), "Instant FAQ Matcher: ", "Instantly responds to standard inquiries (office hours, hotline numbers, fees) in under 20 milliseconds.")

    # --- SECTION 4: CIVIC MODULES ---
    add_heading_1("4. Core Civic Modules & Features")
    
    add_heading_2("4.1 Modern Civic Homepage")
    add_bullet(doc.add_paragraph(), "Live Philippine Standard Time: ", "Real-time PST clock synchronized at the top of the portal.")
    add_bullet(doc.add_paragraph(), "Live Greeting & Status Pill: ", "Time-based greeting (Good Morning/Afternoon/Evening) with a live active pulse indicator.")
    add_bullet(doc.add_paragraph(), "Transparency Stats Ribbon: ", "Displays 4 key metrics: 24/7 Digital Filing, 24-48h Processing, 98.5% Resolution Rate, and 3,500+ Registered Residents.")
    add_bullet(doc.add_paragraph(), "Services Category Explorer: ", "Searchable directory with filter tabs (All, Clearance & Docs, Assistance, Business, Lupon Tagapamayapa).")
    add_bullet(doc.add_paragraph(), "Emergency Hotlines Bar: ", "One-click dialing for Barangay Desk, Tanod Patrol, Health Center, and Fire/PNP.")
    add_bullet(doc.add_paragraph(), "Interactive FAQ Accordion: ", "Expandable answers for frequently asked citizen inquiries.")

    add_heading_2("4.2 Authentication & Security")
    add_bullet(doc.add_paragraph(), "Quick Demo Login: ", "1-click autofill for testing Resident, Chairman, and Secretary roles.")
    add_bullet(doc.add_paragraph(), "Live Password Strength Meter: ", "Color-coded visual indicator assessing password entropy.")
    add_bullet(doc.add_paragraph(), "Data Privacy Act (R.A. 10173): ", "Explicit consent checkbox ensuring regulatory compliance.")

    add_heading_2("4.3 Resident & Official Dashboards")
    add_bullet(doc.add_paragraph(), "Resident Dashboard: ", "Summary stat cards (Pending, In Progress, Resolved, Ideas) and personal request tracking table.")
    add_bullet(doc.add_paragraph(), "Official Dashboard: ", "5-column KPI ribbon, quick management cards, filterable incident table, and category distribution charts.")

    # --- SECTION 5: ACCESSIBILITY ---
    add_heading_1("5. Accessibility & Inclusive Design (WCAG AAA)")
    doc.add_paragraph(
        "Engineered to accommodate senior citizens and visually impaired users following WCAG 2.1 AAA guidelines:"
    )
    add_bullet(doc.add_paragraph(), "High Contrast OLED Mode: ", "Replaces gradients with pure black (#000000) background, bold white (#ffffff) text, and high-visibility yellow (#ffff00) and neon green (#00ff88) accents.")
    add_bullet(doc.add_paragraph(), "Dynamic Text Sizing: ", "Switchable between Normal (100%), Large (112%), and Extra Large (124%).")
    add_bullet(doc.add_paragraph(), "Keyboard Navigation: ", "Full tab navigation support with semantic landmarks and high-visibility focus indicators.")

    # --- SECTION 6: API SPECIFICATION ---
    add_heading_1("6. API Specification & Endpoints")
    
    api_table = doc.add_table(rows=10, cols=4)
    api_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    api_headers = ["HTTP Method", "Endpoint", "Function Description", "Authentication Required"]
    for i, title in enumerate(api_headers):
        cell = api_table.rows[0].cells[i]
        cell.text = title
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
        p = cell.paragraphs[0]
        p.runs[0].font.bold = True
        p.runs[0].font.color.rgb = RGBColor(255, 255, 255)
        p.runs[0].font.size = Pt(9.5)

    endpoints = [
        ("POST", "/api/auth/register", "Register a new resident account", "No"),
        ("POST", "/api/auth/login", "Authenticate user and issue JWT session token", "No"),
        ("GET", "/api/ai/status", "Query active AI engine status (Ollama, Gemini, Smart)", "Yes"),
        ("POST", "/api/ai/complaint-assist", "AI complaint auto-categorization and formal rewrite", "Yes (Resident)"),
        ("POST", "/api/ai/chat", "Send user query to Barangay AI Assistant", "Yes"),
        ("POST", "/api/ai/chat/stream", "Stream real-time AI responses via Server-Sent Events (SSE)", "Yes"),
        ("GET / POST", "/api/complaints", "Retrieve or submit citizen incident reports", "Yes"),
        ("GET", "/api/services", "List official barangay certificates, fees, and requirements", "No"),
        ("GET", "/api/dashboard/stats", "Retrieve dashboard KPI analytics and summary metrics", "Yes")
    ]

    for row_idx, (method, ep, desc, auth_req) in enumerate(endpoints, start=1):
        row = api_table.rows[row_idx]
        row.cells[0].text = method
        row.cells[1].text = ep
        row.cells[2].text = desc
        row.cells[3].text = auth_req
        for col_idx, cell in enumerate(row.cells):
            set_cell_background(cell, "FFFFFF" if row_idx % 2 == 1 else "F8FAFC")
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
            p = cell.paragraphs[0]
            p.runs[0].font.size = Pt(9)
            if col_idx == 0:
                p.runs[0].font.bold = True
                p.runs[0].font.color.rgb = EMERALD

    # --- FOOTER ---
    doc.add_paragraph().paragraph_format.space_before = Pt(24)
    p_foot = doc.add_paragraph()
    r_foot = p_foot.add_run("Barangay Burgos Digital Governance System • Technical Documentation • 2026")
    r_foot.font.size = Pt(9)
    r_foot.font.color.rgb = GRAY
    p_foot.alignment = WD_ALIGN_PARAGRAPH.CENTER

    output_path = "c:\\Users\\alice\\OneDrive\\Documents\\Project2-main\\BARANGAY_PORTAL_DOCUMENTATION.docx"
    doc.save(output_path)
    print(f"[SUCCESS] Generated English Word document at: {output_path}")

if __name__ == "__main__":
    create_document()
