"""
Features-only documentation for the Barangay Burgos Django Portal.
"""
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls


def bg(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>'))


def pad(cell, t=80, b=80, l=120, r=120):
    tcPr = cell._tc.get_or_add_tcPr()
    tcPr.append(parse_xml(f'''<w:tcMar {nsdecls("w")}>
        <w:top w:w="{t}" w:type="dxa"/>
        <w:bottom w:w="{b}" w:type="dxa"/>
        <w:left w:w="{l}" w:type="dxa"/>
        <w:right w:w="{r}" w:type="dxa"/>
    </w:tcMar>'''))


NAVY    = RGBColor(15,  23,  42)
EMERALD = RGBColor(5,  150, 105)
BLUE    = RGBColor(30,  58, 138)
GRAY    = RGBColor(100,116, 139)
TEXT    = RGBColor(30,  41,  59)
WHITE   = RGBColor(255,255, 255)
AMBER   = RGBColor(180, 100,  10)


def build():
    doc = Document()
    for sec in doc.sections:
        sec.top_margin    = Inches(1.0)
        sec.bottom_margin = Inches(1.0)
        sec.left_margin   = Inches(1.1)
        sec.right_margin  = Inches(1.1)

    doc.styles['Normal'].font.name = 'Segoe UI'
    doc.styles['Normal'].font.size = Pt(10.5)
    doc.styles['Normal'].font.color.rgb = TEXT

    # ── helpers ────────────────────────────────────────────────────────────
    def h1(txt):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after  = Pt(5)
        r = p.add_run(txt)
        r.font.size = Pt(16); r.font.bold = True; r.font.color.rgb = NAVY

    def h2(txt):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(11)
        p.paragraph_format.space_after  = Pt(3)
        r = p.add_run(txt)
        r.font.size = Pt(12.5); r.font.bold = True; r.font.color.rgb = EMERALD

    def body(txt):
        p = doc.add_paragraph(txt)
        p.paragraph_format.space_after = Pt(4)

    def bullet(bold_part, rest=""):
        p = doc.add_paragraph()
        p.style = 'List Bullet'
        p.paragraph_format.space_after = Pt(3)
        r1 = p.add_run(bold_part); r1.font.bold = True; r1.font.color.rgb = NAVY
        r2 = p.add_run(rest);      r2.font.color.rgb = TEXT

    def feature_box(title, items, box_bg="EFF6FF", title_color=None):
        """A highlighted card for a feature group."""
        t = doc.add_table(rows=1, cols=1)
        c = t.rows[0].cells[0]
        bg(c, box_bg); pad(c, t=110, b=110, l=150, r=150)
        p = c.paragraphs[0]
        r1 = p.add_run(title + "\n")
        r1.font.bold = True; r1.font.size = Pt(10.5)
        r1.font.color.rgb = title_color or BLUE
        for item in items:
            r2 = p.add_run("   •  " + item + "\n")
            r2.font.size = Pt(9.5)
        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    def divider():
        doc.add_paragraph("─" * 78).paragraph_format.space_after = Pt(2)

    # ══════════════════════════════════════════════════════════════════════
    # COVER
    # ══════════════════════════════════════════════════════════════════════
    p = doc.add_paragraph()
    r = p.add_run("REPUBLIC OF THE PHILIPPINES  •  BARANGAY BURGOS  •  OFFICIAL DIGITAL PORTAL")
    r.font.color.rgb = EMERALD
    r.font.size = Pt(9)
    r.font.bold = True
    p.paragraph_format.space_after = Pt(2)

    p2 = doc.add_paragraph()
    r = p2.add_run("Barangay Burgos e-Governance Portal")
    r.font.size = Pt(24); r.font.bold = True; r.font.color.rgb = NAVY
    p2.paragraph_format.space_after = Pt(3)

    p3 = doc.add_paragraph()
    r3 = p3.add_run("System Features Documentation")
    r3.font.size = Pt(14); r3.font.color.rgb = BLUE
    p3.paragraph_format.space_after = Pt(4)

    p4 = doc.add_paragraph()
    r4 = p4.add_run(
        "This document describes all features available to residents, secretary, and chairman "
        "in the Barangay Burgos digital governance platform."
    )
    r4.font.size = Pt(10); r4.font.color.rgb = GRAY
    p4.paragraph_format.space_after = Pt(16)

    divider()

    # ══════════════════════════════════════════════════════════════════════
    # USER ROLES OVERVIEW
    # ══════════════════════════════════════════════════════════════════════
    h1("User Roles Overview")
    body(
        "The portal has three types of users, each with their own set of features and "
        "access permissions:"
    )

    tbl = doc.add_table(rows=4, cols=2)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    # header
    for i, hdr in enumerate(["Role", "Who uses it"]):
        c = tbl.rows[0].cells[i]
        c.text = hdr; bg(c, "0F172A"); pad(c)
        c.paragraphs[0].runs[0].font.bold = True
        c.paragraphs[0].runs[0].font.color.rgb = WHITE
        c.paragraphs[0].runs[0].font.size = Pt(10)
    role_data = [
        ("Resident",  "Regular barangay citizens who want to use government services online."),
        ("Secretary", "Barangay administrative staff who process requests and manage records."),
        ("Chairman",  "The Punong Barangay who oversees operations and has full system access."),
    ]
    for idx, (r_name, r_desc) in enumerate(role_data, start=1):
        row = tbl.rows[idx]
        row.cells[0].text = r_name; row.cells[1].text = r_desc
        for col, cell in enumerate(row.cells):
            bg(cell, "FFFFFF" if idx % 2 == 1 else "F8FAFC")
            pad(cell, 80, 80, 100, 100)
            cell.paragraphs[0].runs[0].font.size = Pt(9.5)
            if col == 0:
                cell.paragraphs[0].runs[0].font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    divider()

    # ══════════════════════════════════════════════════════════════════════
    # 1. HOMEPAGE
    # ══════════════════════════════════════════════════════════════════════
    h1("Feature 1: Public Homepage")
    body(
        "The homepage is publicly accessible — no login required. It serves as the main entry "
        "point for citizens to learn about barangay services and find help."
    )
    feature_box("What you can see on the homepage:", [
        "Barangay name, mission statement, and welcome message.",
        "Highlighted list of available barangay services (clearance, certificates, permits, etc.).",
        "Latest official announcements and news from the barangay.",
        "Emergency contact numbers and hotlines for quick reference.",
        "Photo gallery preview showing barangay events and community activities.",
        "Key statistics: number of residents served, complaints resolved, services available.",
    ], box_bg="F0FDF4")

    # ══════════════════════════════════════════════════════════════════════
    # 2. REGISTRATION & LOGIN
    # ══════════════════════════════════════════════════════════════════════
    h1("Feature 2: Account Registration & Login")
    body(
        "Residents can create their own account on the portal. For security, accounts require "
        "approval from barangay officials before they become active."
    )
    h2("For Residents — Registration")
    bullet("Fill out registration form: ", "Full name, username, email, password, address, and phone number.")
    bullet("Upload verification document: ", "Optional — valid ID or proof of residence to support account approval.")
    bullet("Await approval: ", "The account is reviewed by the Secretary or Chairman before it is activated.")
    bullet("Rejection notice: ", "If rejected, the resident receives a written reason so they can correct and reapply.")

    h2("For Officials — Account Approval")
    bullet("Pending registrations queue: ", "Officials see a list of all accounts waiting for review.")
    bullet("Approve or Reject: ", "One-click approval activates the account; rejection sends a reason to the applicant.")

    h2("Login & Session")
    bullet("Secure login: ", "Username and password authentication with session management.")
    bullet("Login history: ", "The system logs every login event (time, IP address, device) for security.")
    bullet("Suspicious login flagging: ", "Unusual logins can be flagged for security review by officials.")

    divider()

    # ══════════════════════════════════════════════════════════════════════
    # 3. DASHBOARD
    # ══════════════════════════════════════════════════════════════════════
    h1("Feature 3: Personalized Dashboard")
    body(
        "After logging in, each user sees a dashboard tailored to their role."
    )
    h2("Resident Dashboard")
    bullet("My Complaints summary: ", "Count of complaints by status — Pending, In Progress, Resolved, Closed.")
    bullet("My Service Requests: ", "Status of any document or clearance applications filed.")
    bullet("My Suggestions: ", "List of community ideas submitted and their current status.")
    bullet("Recent Notifications: ", "Alerts for status changes, messages from officials, and new announcements.")
    bullet("Quick-access shortcuts: ", "One-click buttons to file a complaint, request a document, or chat with the AI Captain.")

    h2("Secretary / Chairman Dashboard")
    bullet("Complaint overview: ", "Total complaints, new filings this week, cases in progress, and cases resolved.")
    bullet("Pending approvals: ", "New resident accounts waiting for activation.")
    bullet("Recent activity feed: ", "Latest complaints filed, status changes, and announcements posted.")
    bullet("Analytics summary: ", "Quick graphs showing complaint categories and resolution trends.")

    divider()

    # ══════════════════════════════════════════════════════════════════════
    # 4. COMPLAINTS
    # ══════════════════════════════════════════════════════════════════════
    h1("Feature 4: Complaints Management")
    body(
        "Residents can formally file community complaints online. Officials manage and resolve "
        "them through a structured workflow."
    )
    h2("Filing a Complaint (Resident)")
    bullet("Choose a category: ", "Infrastructure, Sanitation, Noise & Disturbance, Public Safety, and others.")
    bullet("Describe the issue: ", "Title and full description of the problem.")
    bullet("Set priority: ", "Low, Medium, High, or Urgent.")
    bullet("Attach photos or files: ", "Upload supporting evidence (photos, documents, videos).")
    bullet("File anonymously: ", "Submit without revealing your identity — a unique tracking reference code is generated so you can still follow up.")

    h2("Complaint Status Tracking")
    feature_box("6-Stage Complaint Workflow:", [
        "Submitted — Complaint has been filed by the resident.",
        "Under Review — Officials are verifying the complaint details.",
        "In Progress — The case is actively being handled.",
        "Resolved — The issue has been addressed.",
        "Closed — The complaint is fully closed after resident acknowledgment.",
        "Rejected — The complaint was not accepted, with a stated reason.",
    ], box_bg="FFF7ED", title_color=AMBER)

    h2("Managing Complaints (Officials)")
    bullet("View all complaints: ", "Full list with filters by status, category, priority, and date.")
    bullet("Assign to officer: ", "Delegate a complaint to a specific official for accountability.")
    bullet("Set estimated resolution date: ", "Commit to a resolution timeline visible to the resident.")
    bullet("Update status with notes: ", "Move the complaint through stages and add official remarks.")
    bullet("Add internal chairman notes: ", "Private notes visible only to officials.")
    bullet("Full audit trail: ", "Every status change is recorded — who changed it, when, and why.")
    bullet("Resident feedback: ", "After resolution, residents rate their satisfaction (1–5 stars) and leave comments.")

    divider()

    # ══════════════════════════════════════════════════════════════════════
    # 5. AI CAPTAIN
    # ══════════════════════════════════════════════════════════════════════
    h1("Feature 5: AI Virtual Barangay Captain (Kapitan AI)")
    body(
        "Kapitan AI is an intelligent chatbot that acts like a virtual barangay captain. "
        "Residents can ask questions in Tagalog, English, or Taglish and receive clear, "
        "helpful guidance immediately — 24 hours a day, 7 days a week."
    )
    h2("What Kapitan AI can help with:")
    bullet("Document requests: ", "Step-by-step instructions on how to get a barangay clearance, indigency certificate, business permit, and more — including what documents to bring and the fees.")
    bullet("Filing complaints: ", "Guidance on what category to choose, how to describe the issue, and what to expect.")
    bullet("Understanding ordinances: ", "Plain-language explanations of barangay policies and rules.")
    bullet("Emergency situations: ", "Step-by-step guidance for emergencies (fire, medical, security).")
    bullet("Business permits and construction: ", "Requirements, timelines, and who to approach.")
    bullet("Social welfare and assistance: ", "Information on available programs and how to apply.")
    bullet("General barangay questions: ", "Office hours, contact numbers, office locations, and procedures.")

    h2("How the AI works:")
    bullet("Powered by AI (GPT): ", "Uses advanced language AI to understand and respond to natural conversation.")
    bullet("Policy knowledge base: ", "Officials can load barangay ordinances and FAQs into the AI so answers are accurate and barangay-specific.")
    bullet("Situation templates: ", "Pre-built step-by-step guides for the most common citizen scenarios.")
    bullet("Conversation memory: ", "The AI remembers the context of the current session for natural follow-up questions.")
    bullet("Satisfaction rating: ", "At the end of a conversation, residents can rate how helpful the AI was.")

    divider()

    # ══════════════════════════════════════════════════════════════════════
    # 6. SERVICES
    # ══════════════════════════════════════════════════════════════════════
    h1("Feature 6: Barangay Services & Certificates")
    body(
        "The services module displays all official barangay documents and certificates "
        "available to residents, with complete information so they can prepare in advance."
    )
    feature_box("Available Barangay Services (examples):", [
        "Barangay Clearance — for employment, business, or personal requirements.",
        "Certificate of Indigency — for scholarship, medical assistance, and other aid programs.",
        "Barangay Business Clearance — required for business permit applications.",
        "Solo Parent Certificate — for solo parent benefits and privileges.",
        "Certificate of Residency — proof of address within the barangay.",
        "Barangay ID — official identification document for residents.",
    ], box_bg="F0FDF4")

    bullet("Transparent fees: ", "Each service shows the exact processing fee so residents can prepare the right amount.")
    bullet("Processing time: ", "Estimated number of days before the document is ready for pick-up.")
    bullet("Requirements list: ", "Clear list of documents or IDs needed before going to the barangay hall.")

    divider()

    # ══════════════════════════════════════════════════════════════════════
    # 7. SUGGESTIONS
    # ══════════════════════════════════════════════════════════════════════
    h1("Feature 7: Community Suggestions & Ideas")
    body(
        "Residents can submit ideas and proposals for improving the barangay. "
        "This gives citizens a direct voice in local governance."
    )
    bullet("Submit an idea: ", "Write a title, description, and choose a category for your suggestion.")
    bullet("Community upvoting: ", "Other residents can upvote ideas they support — popular ideas rise to the top.")
    bullet("Official review: ", "The Secretary or Chairman reviews top suggestions and updates their status.")
    bullet("Status tracking: ", "Residents see whether their suggestion is Under Review, Planned, In Progress, or Completed.")

    divider()

    # ══════════════════════════════════════════════════════════════════════
    # 8. ANNOUNCEMENTS
    # ══════════════════════════════════════════════════════════════════════
    h1("Feature 8: Official Announcements & Alerts")
    body(
        "The barangay publishes official news, advisories, and emergency alerts "
        "that residents can read any time on the portal."
    )
    bullet("Official notices: ", "Public health advisories, schedule changes, community events, and government programs.")
    bullet("Emergency alerts: ", "Time-sensitive announcements flagged as urgent appear prominently on the homepage.")
    bullet("Posted by officials: ", "Only Secretary and Chairman can post and manage announcements.")

    divider()

    # ══════════════════════════════════════════════════════════════════════
    # 9. NOTIFICATIONS
    # ══════════════════════════════════════════════════════════════════════
    h1("Feature 9: In-App Notification System")
    body(
        "Users receive real-time in-app alerts so they are always informed about "
        "what is happening with their requests and account."
    )
    bullet("Complaint status updates: ", "Notified every time your complaint moves to a new stage.")
    bullet("New messages: ", "Alerted when an official sends you a direct message.")
    bullet("Account approval: ", "Residents are notified when their account is approved or rejected.")
    bullet("New announcements: ", "Residents are alerted when the barangay posts important notices.")

    divider()

    # ══════════════════════════════════════════════════════════════════════
    # 10. DIRECT MESSAGES
    # ══════════════════════════════════════════════════════════════════════
    h1("Feature 10: Direct Messaging")
    body(
        "Residents and officials can exchange private messages directly within the portal "
        "for case follow-ups and private concerns."
    )
    bullet("Resident to official: ", "Send a private message to the barangay secretary or other officials.")
    bullet("Official to resident: ", "Officials can message residents about their complaints or requests.")
    bullet("Message history: ", "Complete thread of all messages in a conversation is kept for reference.")

    divider()

    # ══════════════════════════════════════════════════════════════════════
    # 11. GALLERY
    # ══════════════════════════════════════════════════════════════════════
    h1("Feature 11: Barangay Photo Gallery")
    body(
        "A public photo gallery showcasing barangay events, programs, and community activities "
        "to promote transparency and community engagement."
    )
    bullet("Public access: ", "Viewable by anyone, no login required.")
    bullet("Managed by officials: ", "Secretary or Chairman can upload, organize, and remove photos.")

    divider()

    # ══════════════════════════════════════════════════════════════════════
    # 12. ANALYTICS
    # ══════════════════════════════════════════════════════════════════════
    h1("Feature 12: Analytics & Governance Reports")
    body(
        "Officials have access to a data analytics dashboard that gives a clear picture "
        "of barangay performance and community needs."
    )
    bullet("Complaint volume: ", "How many complaints were filed over time (daily, weekly, monthly).")
    bullet("Category breakdown: ", "Which types of complaints are most common (e.g. noise, road, sanitation).")
    bullet("Resolution rate: ", "Percentage of complaints that were resolved vs. pending or rejected.")
    bullet("Officer performance: ", "Track how quickly each assigned officer resolves cases.")
    bullet("Suggestion trends: ", "Most popular community ideas and their implementation status.")

    divider()

    # ══════════════════════════════════════════════════════════════════════
    # 13. FEEDBACK
    # ══════════════════════════════════════════════════════════════════════
    h1("Feature 13: Resident Feedback & Satisfaction Rating")
    body(
        "After a complaint is resolved, residents can evaluate the quality of service "
        "they received from the barangay."
    )
    bullet("Star rating (1–5): ", "Rate how satisfied you are with the resolution.")
    bullet("Written feedback: ", "Optional comments about the experience.")
    bullet("Officials see ratings: ", "Feedback is visible to officials for continuous service improvement.")

    divider()

    # ══════════════════════════════════════════════════════════════════════
    # FEATURE SUMMARY TABLE
    # ══════════════════════════════════════════════════════════════════════
    h1("Feature Access Summary by Role")
    body("Quick reference table showing which features are available to each user role:")

    tbl2 = doc.add_table(rows=15, cols=4)
    tbl2.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers2 = ["Feature", "Resident", "Secretary", "Chairman"]
    for i, hdr in enumerate(headers2):
        c = tbl2.rows[0].cells[i]
        c.text = hdr; bg(c, "0F172A"); pad(c)
        c.paragraphs[0].runs[0].font.bold = True
        c.paragraphs[0].runs[0].font.color.rgb = WHITE
        c.paragraphs[0].runs[0].font.size = Pt(9)

    feature_access = [
        ("Public Homepage",              "Yes",      "Yes",      "Yes"),
        ("Account Registration",         "Yes",      "No",       "No"),
        ("Account Approval / Rejection", "No",       "Yes",      "Yes"),
        ("Complaint Filing",             "Yes",      "No",       "No"),
        ("Complaint Management",         "View own", "Yes",      "Yes"),
        ("AI Captain Chatbot",           "Yes",      "Yes",      "Yes"),
        ("Barangay Services Info",       "Yes",      "Yes",      "Yes"),
        ("Community Suggestions",        "Yes",      "View",     "Yes"),
        ("Official Announcements",       "View",     "Post",     "Post"),
        ("In-App Notifications",         "Yes",      "Yes",      "Yes"),
        ("Direct Messages",              "Yes",      "Yes",      "Yes"),
        ("Photo Gallery",                "View",     "Manage",   "Manage"),
        ("Analytics Dashboard",          "No",       "Yes",      "Yes"),
        ("Resident Satisfaction Feedback","Yes",     "View",     "View"),
    ]

    for idx, row_data in enumerate(feature_access, start=1):
        row = tbl2.rows[idx]
        for col_idx, val in enumerate(row_data):
            c = row.cells[col_idx]
            c.text = val
            bg(c, "FFFFFF" if idx % 2 == 1 else "F8FAFC")
            pad(c, 60, 60, 100, 100)
            run = c.paragraphs[0].runs[0]
            run.font.size = Pt(9)
            if col_idx == 0:
                run.font.bold = True
            elif val == "Yes":
                run.font.color.rgb = EMERALD
                run.font.bold = True
            elif val == "No":
                run.font.color.rgb = RGBColor(180, 50, 50)

    # ── FOOTER ────────────────────────────────────────────────────────────
    doc.add_paragraph().paragraph_format.space_before = Pt(24)
    p_foot = doc.add_paragraph()
    r_foot = p_foot.add_run(
        "Barangay Burgos Digital Governance Portal  •  Features Documentation  •  2026"
    )
    r_foot.font.size = Pt(9); r_foot.font.color.rgb = GRAY
    p_foot.alignment = WD_ALIGN_PARAGRAPH.CENTER

    return doc


if __name__ == "__main__":
    out = (
        r"c:\Users\alice\OneDrive\Documents\Project2-main"
        r"\BARANGAY_PORTAL_DOCUMENTATION.docx"
    )
    build().save(out)
    print(f"[SUCCESS] Features documentation saved: {out}")
