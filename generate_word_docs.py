import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

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
    r_sub = p_subtitle.add_run("Official Technical & System Features Documentation")
    r_sub.font.size = Pt(14)
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
    cells2[0].text = "Repository:"
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

    # Helper function for Section Headings
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

    def add_heading_3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(text)
        r.font.size = Pt(11)
        r.font.bold = True
        r.font.color.rgb = DARK_BLUE
        return p

    def add_bullet(p, bold_prefix, text):
        p.style = 'List Bullet'
        p.paragraph_format.space_after = Pt(3)
        r1 = p.add_run(bold_prefix)
        r1.font.bold = True
        r1.font.color.rgb = NAVY
        r2 = p.add_run(text)
        r2.font.color.rgb = TEXT_COLOR

    # --- SECTION 1: SYSTEM OVERVIEW ---
    add_heading_1("1. Executive Summary & Architecture Overview")
    doc.add_paragraph(
        "Ang Barangay Burgos Digital Portal ay isang full-stack web application na idinisenyo upang gawing mabilis, tapat, "
        "at transparent ang paghahatid ng mga serbisyong pambarangay. Pinapalitan nito ang tradisyonal na mahabang pila ng "
        "isang 24/7 self-service digital governance system na may kasamang Artificial Intelligence (AI)."
    )

    p_arch = doc.add_paragraph()
    p_arch.add_run("Teknolohiyang Ginamit (Full-Stack Stack):").font.bold = True
    add_bullet(doc.add_paragraph(), "Frontend Client: ", "React 18, Vite 5, Zustand para sa state management, TanStack React Query, Lucide Icons, at Custom Vanilla CSS Design System.")
    add_bullet(doc.add_paragraph(), "Backend API Server: ", "Node.js, Express.js 4, JSON Web Token (JWT) Authentication, Bcrypt Password Encryption, at Server-Sent Events (SSE).")
    add_bullet(doc.add_paragraph(), "Database Layer: ", "PostgreSQL Database pinamamahalaan gamit ang Prisma 5 ORM na may strict schema modeling at automated seeding.")
    add_bullet(doc.add_paragraph(), "AI Intelligence Engine: ", "Multi-Provider Architecture na sumusuporta sa Ollama (Local LLM), Google Gemini, Groq, OpenAI, at built-in Smart Assist NLP Rule Engine.")

    # --- SECTION 2: USER ROLES ---
    add_heading_1("2. Mga Antas ng Gumagamit (Role-Based Access Control)")
    doc.add_paragraph("May tatlong pangunahing antas ng gumagamit sa system na may kani-kaniyang access at pahintulot:")

    role_table = doc.add_table(rows=4, cols=3)
    role_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    role_headers = ["Role", "Pangunahing Gumagamit", "Mga Kakayahan at Pahintulot (Permissions)"]
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
        ("RESIDENT (Residente)", "Mamamayan / Residente ng Barangay", "Magsumite ng reklamo gamit ang AI Assistant, mag-request ng barangay clearance/certificates, magbigay ng suhestiyon, makipag-chat sa Barangay AI Assistant, at mag-track ng live progress ng mga kahilingan."),
        ("SECRETARY (Kalihim)", "Barangay Secretary at Admin Staff", "Suriin ang mga naihaing reklamo, mag-update ng status at magbigay ng official remarks, mag-apruba ng mga sertipiko at permits, at maglabas ng mga opisyal na anunsyo."),
        ("CHAIRMAN (Punong Barangay)", "Kapitan / Barangay Captain", "Komprehensibong overview ng buong barangay, pagsusuri ng mga analytics at resolution rates, pag-apruba ng mga sensitibong dispute (Lupon Tagapamayapa), at kabuuang pamamahala.")
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

    # --- SECTION 3: AI FEATURES ---
    add_heading_1("3. 🤖 Malalimang Pagsusuri sa mga AI Features (Deep Dive)")
    doc.add_paragraph(
        "Isa sa pinakamahalagang lakas ng portal ay ang komprehensibong AI subsystem na binuo upang mapadali ang pakikipag-ugnayan "
        "ng mamamayan sa pamahalaan. Ang AI layer ay dinisenyo upang maging 100% maaasahan kahit offline o walang binabayarang API key."
    )

    add_heading_2("3.1 Multi-Provider AI Engine na may Resilient Fallback")
    doc.add_paragraph(
        "Gumagamit ang system ng isang dynamic provider pipeline sa 'server/src/services/ai.js'. Sinusuri nito kung anong AI engine ang available sa sumusunod na priority order:"
    )
    add_bullet(doc.add_paragraph(), "1. Ollama (Local AI): ", "Kung may tumatakbong Ollama instance sa server (e.g. Llama 3.2 1B/3B o Mistral), ito ang gagamitin. Libre, walang token cost, at 100% nananatili ang data sa loob ng server.")
    add_bullet(doc.add_paragraph(), "2. Google Gemini API: ", "Kung naka-configure ang GEMINI_API_KEY, ginagamit nito ang high-speed cloud intelligence ng Google.")
    add_bullet(doc.add_paragraph(), "3. Groq / OpenAI API: ", "Alternatibong ultra-fast cloud LLM inference.")
    add_bullet(doc.add_paragraph(), "4. Smart Assist Engine (Zero-Dependency Fallback): ", "Kung walang LLM o walang internet, awtomatikong sumasalo ang built-in NLP algorithm. Hindi kailanman mag-e-error o magiging blangko ang screen ng residente.")

    add_heading_2("3.2 AI Complaint Assistant & Auto-Refinement")
    doc.add_paragraph(
        "Kadalasan, ang mga residente ay nagrereklamo sa pamamagitan ng impormal, magulo, o emosyonal na pananalita. "
        "Ang AI Complaint Assistant ay may kakayahang i-transform ang raw input sa isang pormal na official barangay document bago i-submit:"
    )
    add_bullet(doc.add_paragraph(), "Awtomatikong Pag-uuri (Auto-Categorization): ", "Natutukoy kung ang reklamo ay Infrastructure, Sanitation, Public Safety, Noise & Disturbance, o Others.")
    add_bullet(doc.add_paragraph(), "Priority Level Detection: ", "Nagtatalaga ng antas (URGENT, HIGH, MEDIUM, LOW) batay sa mga banta sa kaligtasan (hal. baha, sunog, holdap, sirang kalsada).")
    add_bullet(doc.add_paragraph(), "Pormal na Tagalog Rewrite: ", "Isinasaayos ang mga pangungusap sa pormal at magalang na Tagalog na akma para sa mga pagdinig ng Lupon o opisyal na rekord.")
    add_bullet(doc.add_paragraph(), "Fact Preservation Guarantee: ", "Mahigpit na pinapanatili ang eksaktong lokasyon, petsa, at pangalan nang walang idinadagdag na maling impormasyon.")

    # Callout Box Example
    callout = doc.add_table(rows=1, cols=1)
    c_cell = callout.rows[0].cells[0]
    set_cell_background(c_cell, "ECFDF5")
    set_cell_margins(c_cell, top=120, bottom=120, left=180, right=180)
    cp = c_cell.paragraphs[0]
    cr1 = cp.add_run("💡 Halimbawa ng AI Complaint Transformation:\n")
    cr1.font.bold = True
    cr1.font.color.rgb = EMERALD
    cr2 = cp.add_run(
        "• Raw Input ng Residente: \"may butas kalsada tapat ng tindahan ni aling nena delikado sa motor baha pa\"\n"
        "• AI Polished Title: \"Lubak at Pagbaha sa Kalsada sa Purok 3\"\n"
        "• AI Formal Description: \"Nais kong i-report ang malaking butas sa kalsada sa tapat ng Nena Store na nagdudulot ng panganib sa mga nagmomotor at nagiging sanhi ng pagbaha. Humihiling po kami ng agarang aksyon mula sa barangay.\"\n"
        "• Kategorya: Infrastructure | Priority: HIGH"
    )
    cr2.font.size = Pt(9.5)

    add_heading_2("3.3 AI Barangay Chatbot (Real-time SSE Streaming)")
    doc.add_paragraph(
        "Nasa ibabang sulok ng portal ang AI Assistant na laging handang tumulong sa mga mamamayan sa pamamagitan ng natural na usapan:"
    )
    add_bullet(doc.add_paragraph(), "Server-Sent Events (SSE) Streaming: ", "Real-time na lumalabas ang mga salita habang nag-iisip ang AI para sa napakabilis at modernong karanasan.")
    add_bullet(doc.add_paragraph(), "Context-Aware System: ", "Awtomatikong binabasa ng AI ang buong katalogo ng mga serbisyo ng barangay, kaukulang bayad (fees), requirements, processing days, at ang live status ng mga reklamo ng naka-login na residente.")
    add_bullet(doc.add_paragraph(), "Natural Tagalog / Taglish Flow: ", "Magalang at madaling kausap gamit ang 'Po/Opo' at wastong terminolohiyang pambarangay.")
    add_bullet(doc.add_paragraph(), "Instant FAQ Matcher: ", "Kapag karaniwang tanong ang itinatanong (hal. office hours, contact number), sinasagot ito agad sa loob lamang ng 15 milliseconds.")

    # --- SECTION 4: CIVIC MODULES ---
    add_heading_1("4. Mga Pangunahing Modyul ng Portal (Core Civic Modules)")
    
    add_heading_2("4.1 Modernong Civic Homepage")
    add_bullet(doc.add_paragraph(), "Live Philippine Standard Time: ", "Real-time synchronizing clock sa itaas ng portal.")
    add_bullet(doc.add_paragraph(), "Live Greeting & Status Pill: ", "Dynamic time greeting kasama ang live online pulse badge.")
    add_bullet(doc.add_paragraph(), "Interactive Stats Ribbon: ", "4-metric transparency bar (24/7 Digital Filing, 24-48h Processing, 98.5% Resolution Rate, 3,500+ Residents).")
    add_bullet(doc.add_paragraph(), "Services Category Explorer: ", "Search input at filter tabs (Lahat, Clearance, Tulong, Negosyo, Lupon).")
    add_bullet(doc.add_paragraph(), "Emergency Hotlines Quick Bar: ", "One-click call buttons para sa Desk, Tanod, Clinic, at BFP.")
    add_bullet(doc.add_paragraph(), "FAQ Accordion: ", "Naka-expand na mga kasagutan sa mga madalas itanong ng residente.")

    add_heading_2("4.2 Authentication at Seguridad")
    add_bullet(doc.add_paragraph(), "Quick Demo Login: ", "1-click autofill para sa Residente, Chairman, at Secretary upang mabilisang masubukan ang system.")
    add_bullet(doc.add_paragraph(), "Password Strength Meter: ", "Color-coded animated bar na nagpapakita ng lakas ng password.")
    add_bullet(doc.add_paragraph(), "Data Privacy Act (R.A. 10173): ", "Legal consent checkbox para sa proteksyon ng personal na impormasyon ng mamamayan.")

    add_heading_2("4.3 Resident at Official Dashboards")
    add_bullet(doc.add_paragraph(), "Resident Dashboard: ", "Summary cards (Pending, In Progress, Resolved, Ideas) at recent requests tracking table.")
    add_bullet(doc.add_paragraph(), "Official Dashboard: ", "5-column KPI ribbon, quick management action cards, activity table na may search at status filter, at category analytics breakdown.")

    # --- SECTION 5: ACCESSIBILITY ---
    add_heading_1("5. Accessibility at Inclusive Design (WCAG AAA)")
    doc.add_paragraph(
        "Isinaalang-alang ang mga nakatatanda at may kapansanan sa paningin alinsunod sa pandaigdigang pamantayan ng WCAG 2.1:"
    )
    add_bullet(doc.add_paragraph(), "High Contrast OLED Mode: ", "Pinapalitan ang background ng solid black (#000000) na may puting teksto at matingkad na dilaw (#ffff00) at neon green (#00ff88) accents.")
    add_bullet(doc.add_paragraph(), "Text Sizing Control: ", "Pumili sa pagitan ng Normal (100%), Malaki / Large (112%), at Sobrang Laki / XL (124%).")
    add_bullet(doc.add_paragraph(), "Keyboard Navigation: ", "Buong accessibility gamit ang Tab at screen readers na may maayos na ARIA attributes.")

    # --- SECTION 6: API ENDPOINTS ---
    add_heading_1("6. Talaan ng mga API Endpoints (API Specification)")
    
    api_table = doc.add_table(rows=10, cols=4)
    api_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    api_headers = ["Method", "Endpoint", "Paglalarawan", "Auth Required"]
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
        ("POST", "/api/auth/register", "Pagpaparehistro ng bagong residente", "Hindi"),
        ("POST", "/api/auth/login", "Pag-login at pag-isyu ng JWT token", "Hindi"),
        ("GET", "/api/ai/status", "Suriin ang aktibong AI provider (Ollama, Gemini, Smart)", "Oo"),
        ("POST", "/api/ai/complaint-assist", "AI formal rewrite, kategorya, at priority detection", "Oo (Resident)"),
        ("POST", "/api/ai/chat", "Makipag-usap sa Barangay AI Assistant", "Oo"),
        ("POST", "/api/ai/chat/stream", "Real-time token streaming chat (Server-Sent Events)", "Oo"),
        ("GET / POST", "/api/complaints", "Tingnan at magsumite ng mga reklamo", "Oo"),
        ("GET", "/api/services", "Listahan ng mga opisyal na sertipiko at clearances", "Hindi"),
        ("GET", "/api/dashboard/stats", "Kuhanin ang mga bilang at KPI analytics para sa dashboard", "Oo")
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
    r_foot = p_foot.add_run("Barangay Burgos Digital Governance System • Comprehensive Documentation • 2026")
    r_foot.font.size = Pt(9)
    r_foot.font.color.rgb = GRAY
    p_foot.alignment = WD_ALIGN_PARAGRAPH.CENTER

    output_path = "c:\\Users\\alice\\OneDrive\\Documents\\Project2-main\\BARANGAY_PORTAL_DOCUMENTATION.docx"
    doc.save(output_path)
    print(f"[SUCCESS] Generated Word document at: {output_path}")

if __name__ == "__main__":
    create_document()
