# 🏛️ Barangay Burgos e-Services & AI Governance Portal
## Complete Full-System Architecture & Technical Manual (v3.0)

> **Official Barangay Digital Management System**  
> *Modern, transparent, secure, and AI-powered civic governance for Barangay Burgos.*  
> **Live Production URL:** [https://barangay-portal-jqxc.onrender.com/](https://barangay-portal-jqxc.onrender.com/)  
> **Repository:** [GitHub - qwertyuiop547/Project2](https://github.com/qwertyuiop547/Project2.git)  
> **Word Document Download:** [BARANGAY_PORTAL_DOCUMENTATION.docx](file:///c:/Users/alice/OneDrive/Documents/Project2-main/BARANGAY_PORTAL_DOCUMENTATION.docx)

---

## 📑 Table of Contents
1. [Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
2. [Full-Stack System Architecture](#2-full-stack-system-architecture)
3. [Project Directory & File Structure](#3-project-directory--file-structure)
4. [Role-Based Access Control (RBAC) & User Personas](#4-role-based-access-control-rbac--user-personas)
5. [🤖 Deep Dive: AI-Powered Governance Features](#5--deep-dive-ai-powered-governance-features)
   - [5.1 Multi-Provider AI Routing Pipeline](#51-multi-provider-ai-routing-pipeline)
   - [5.2 AI Complaint Assistant & Auto-Refinement](#52-ai-complaint-assistant--auto-refinement)
   - [5.3 Barangay AI Chatbot (Real-Time SSE Streaming)](#53-barangay-ai-chatbot-real-time-sse-streaming)
   - [5.4 Smart NLP Dictionaries & Keyword Matching](#54-smart-nlp-dictionaries--keyword-matching)
6. [Core Civic Modules & User Journeys](#6-core-civic-modules--user-journeys)
   - [6.1 Modern Civic Homepage](#61-modern-civic-homepage)
   - [6.2 Authentication & Data Privacy Act R.A. 10173](#62-authentication--data-privacy-act-ra-10173)
   - [6.3 Resident Dashboard & Case Tracking](#63-resident-dashboard--case-tracking)
   - [6.4 Official Governance & Mediation Dashboard](#64-official-governance--mediation-dashboard)
   - [6.5 Document & Certificate Processing](#65-document--certificate-processing)
   - [6.6 Community Voice & Idea Crowdsourcing](#66-community-voice--idea-crowdsourcing)
   - [6.7 Official Announcements & Alerts](#67-official-announcements--alerts)
7. [Accessibility & Universal Design (WCAG AAA)](#7-accessibility--universal-design-wcag-aaa)
8. [Database Schema & Data Dictionary (Prisma ORM)](#8-database-schema--data-dictionary-prisma-orm)
9. [Complete REST API Specification](#9-complete-rest-api-specification)
10. [Setup, Deployment & Environment Configuration](#10-setup-deployment--environment-configuration)

---

## 1. Executive Summary & Problem Statement

In traditional local government administration across the Philippines, barangay transactions require in-person visits, manual paper logbooks, and long waiting lines. Complaints are frequently filed on loose paper, making status tracking and dispute resolution difficult to audit.

The **Barangay Burgos Digital Governance Portal** modernizes this by providing a unified cloud platform. Citizens can submit complaints with AI assistance, request certificates, suggest community ideas, and consult an AI assistant 24/7. Officials gain access to analytics, case management queues, and automated certificate processing.

---

## 2. Full-Stack System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT (Frontend SPA)                            │
│           React 18 + Vite 5 + Zustand + TanStack Query + CSS3               │
│      (Accessible UI, High Contrast Mode, Dynamic Scaling, SSE Reader)       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ JSON / Server-Sent Events (REST API)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                            SERVER (Backend API)                             │
│       Node.js + Express 4 + JWT Security + Bcrypt + Multer + Validator      │
└──────────────────┬──────────────────────────────────────────┬───────────────┘
                   │ Prisma ORM                               │ AI Routing
┌──────────────────▼──────────┐             ┌─────────────────▼───────────────┐
│     PostgreSQL Database     │             │      Hybrid AI Subsystem        │
│  Prisma 5 + Relational DB   │             │  • Local Ollama (Llama 3.2)     │
│  (Users, Complaints, Cases, │             │  • Google Gemini / Groq / OpenAI│
│   Services, Suggestions)    │             │  • Smart Assist NLP Engine      │
└─────────────────────────────┘             └─────────────────────────────────┘
```

---

## 3. Project Directory & File Structure

```
Project2/
├── client/                     # React Frontend Single-Page Application
│   ├── src/
│   │   ├── components/         # Reusable UI Components
│   │   │   ├── AccessibilityPanel.jsx   # Floating High Contrast & Font Sizer
│   │   │   ├── BarangayChatbot.jsx      # AI Assistant floating modal
│   │   │   ├── FloatingCTA.jsx          # Quick action floating button
│   │   │   ├── Layout.jsx / Layout.css  # Institutional sidebar & topbar
│   │   │   └── Navbar.jsx               # Navigation bar
│   │   ├── context/            # Global State
│   │   │   └── AuthContext.jsx          # Session token & user role management
│   │   ├── lib/                # Client Helpers
│   │   │   ├── api.js                   # Axios HTTP client with auth interceptors
│   │   │   └── chatStream.js            # Server-Sent Events (SSE) stream reader
│   │   ├── pages/              # Application Routes
│   │   │   ├── Home.jsx / Home.css      # Civic homepage
│   │   │   ├── Login.jsx / Register.jsx # Authentication screens
│   │   │   ├── Dashboard.jsx            # Resident & Official KPI dashboards
│   │   │   ├── Complaints.jsx           # Incident reporting & AI assistant
│   │   │   ├── Services.jsx             # Document & clearance applications
│   │   │   ├── Suggestions.jsx          # Community idea crowdsourcing
│   │   │   └── Announcements.jsx        # Public advisories & alerts
│   │   └── index.css           # Global theme variables & typography
│   └── vite.config.js          # Vite build & proxy configuration
│
├── server/                     # Express.js REST API Backend
│   ├── prisma/
│   │   ├── schema.prisma       # Database entity relational schema
│   │   └── seed.js             # Initial accounts & category seed data
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.js         # JWT token verification & role authorization
│   │   ├── routes/
│   │   │   ├── auth.js         # Register, login, session validation
│   │   │   ├── ai.js           # AI status, complaint-assist, chat, streaming
│   │   │   ├── complaints.js   # Incident CRUD & status updates
│   │   │   ├── services.js     # Certificate catalog & requests
│   │   │   ├── suggestions.js  # Ideas & upvoting endpoints
│   │   │   └── announcements.js# Broadcast advisories
│   │   ├── services/
│   │   │   └── ai.js           # Core AI pipeline (Ollama, Gemini, NLP rules)
│   │   └── index.js            # Express application entrypoint & static server
│
├── DOCUMENTATION.md            # Comprehensive Markdown system documentation
├── BARANGAY_PORTAL_DOCUMENTATION.docx # Formatted Word Document
├── generate_word_docs.py       # Automated Word (.docx) generation script
└── render.yaml                 # Render cloud deployment blueprint
```

---

## 4. Role-Based Access Control (RBAC) & User Personas

| Role | Target Persona | Key Capabilities & Permissions |
| :--- | :--- | :--- |
| 👤 **RESIDENT** | Barangay Constituents | File verified complaints with AI assistance, request official clearances/certificates, submit community suggestions, chat with Barangay AI Assistant, and track live filing status. |
| 📋 **SECRETARY** | Barangay Secretary & Admin Staff | Review incoming citizen complaints, update dispute statuses and issue official remarks, process and approve document applications, publish official public announcements. |
| 🏛️ **CHAIRMAN** | Punong Barangay / Captain | High-level governance analytics, review case resolution metrics, oversee Lupon Tagapamayapa dispute mediation, and manage barangay operations. |

### Pre-Seeded Testing Accounts
- **Resident**: `resident@example.com` | `password123` (*Pedro Reyes*)
- **Secretary**: `secretary@barangay.gov.ph` | `password123` (*Maria Santos*)
- **Chairman**: `chairman@barangay.gov.ph` | `password123` (*Juan Dela Cruz*)

---

## 5. 🤖 Deep Dive: AI-Powered Governance Features

### 5.1 Multi-Provider AI Routing Pipeline
The platform evaluates available AI backends in real time:
1. **Ollama (Local Private LLM)**: Connects to local models (`llama3.2:1b`, `llama3:8b`, `mistral`). Zero API costs, high speed, and complete citizen data privacy.
2. **Google Gemini API**: High-speed cloud generative intelligence enabled when `GEMINI_API_KEY` is provided.
3. **Groq / OpenAI API**: Alternative cloud providers for high-concurrency environments.
4. **Smart Assist Engine (Zero-Dependency Fallback)**: When no LLM or internet connection is active, the built-in rule engine autonomously processes Tagalog text, keyword stemming, and report structuring without failing.

### 5.2 AI Complaint Assistant & Auto-Refinement
- **Automatic Categorization**: Classifies reports into `Infrastructure`, `Sanitation`, `Public Safety`, `Noise & Disturbance`, or `Others`.
- **Hazard-Based Priority Scoring**: Assigns `URGENT`, `HIGH`, `MEDIUM`, or `LOW` priority based on safety hazard indicators.
- **Formal Tagalog Synthesis**: Polishes raw or emotional citizen input into courteous, professional Tagalog suitable for barangay hearings while strictly preserving landmarks, dates, and locations.

### 5.3 Barangay AI Chatbot (Real-Time SSE Streaming)
- **Token Streaming via Server-Sent Events (SSE)**: Delivers smooth, typewriter-style output instantly.
- **Dynamic Portal Context**: Injects real-time barangay services, processing fees, document requirements, and the resident's active complaints into the system prompt.
- **Instant FAQ Acceleration**: Standard questions (office hours, hotlines, fees) are answered via fast-path regex in `< 20ms`.

---

## 6. Core Civic Modules & User Journeys

- 🏠 **Homepage (`/`)**: Live Philippine Standard Time clock, time-based greeting, 4-metric transparency stats ribbon, searchable services directory with filter tabs, emergency hotlines bar, and FAQ accordion.
- 🔐 **Authentication (`/login`, `/register`)**: 256-Bit SSL/JWT sessions, Live Password Strength Meter, Data Privacy Act (R.A. 10173) consent, and Quick Demo Login buttons.
- 📊 **Resident Dashboard (`/dashboard`)**: Summary stat cards (Pending, In Progress, Resolved, Ideas) and personal request tracking table.
- 🏛️ **Official Dashboard (`/dashboard`)**: 5-column KPI ribbon, quick management cards, filterable incident table, and category distribution charts.
- 📜 **E-Services (`/services`)**: Online applications for Barangay Clearance, Certificate of Indigency, Business Permit, Solo Parent Certificate, and Barangay ID.
- 💡 **Community Voice (`/suggestions`)**: Citizen proposal submission with community upvoting.
- 📢 **Announcements (`/announcements`)**: Official bulletins, public advisories, and emergency alerts.

---

## 7. Accessibility & Universal Design (WCAG AAA)

- **High Contrast OLED Mode**: Pure black (`#000000`) background, bold white (`#ffffff`) typography, high-visibility yellow (`#ffff00`) buttons, and neon green (`#00ff88`) accents.
- **Dynamic Font Scaling**: Normal (100%), Large (112%), and Extra Large (124%) font sizes.
- **Full Keyboard Navigation**: Semantic landmarks and high-visibility focus indicators.

---

## 8. Database Schema & Data Dictionary (Prisma ORM)

```prisma
model User {
  id            String       @id @default(uuid())
  email         String       @unique
  password      String
  firstName     String
  lastName      String
  phone         String?
  address       String?
  role          Role         @default(RESIDENT)
  isApproved    Boolean      @default(false)
  complaints    Complaint[]
  suggestions   Suggestion[]
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}

model Complaint {
  id          String            @id @default(uuid())
  title       String
  description String
  location    String?
  priority    Priority          @default(MEDIUM)
  status      ComplaintStatus   @default(PENDING)
  isAnonymous Boolean           @default(false)
  userId      String?
  user        User?             @relation(fields: [userId], references: [id])
  categoryId  String
  category    ComplaintCategory  @relation(fields: [categoryId], references: [id])
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
}
```

---

## 9. Complete REST API Specification

| HTTP Method | Endpoint URI | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new resident account | No |
| `POST` | `/api/auth/login` | Authenticate user & issue 7-day JWT session token | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile & permissions | Yes (JWT) |
| `GET` | `/api/ai/status` | Query active AI engine status (Ollama, Gemini, Smart) | Yes |
| `POST` | `/api/ai/complaint-assist` | AI complaint categorization & formal rewrite | Yes (Resident) |
| `POST` | `/api/ai/chat` | Send user query to Barangay AI Assistant | Yes |
| `POST` | `/api/ai/chat/stream` | Stream real-time AI response tokens via SSE | Yes |
| `GET / POST` | `/api/complaints` | Retrieve complaint history or submit new complaint | Yes |
| `PATCH` | `/api/complaints/:id/status` | Update complaint status & official notes | Yes (Admin) |
| `GET` | `/api/services` | List official barangay certificates, fees, and requirements | No |
| `GET` | `/api/dashboard/stats` | Retrieve KPI analytics and summary metrics | Yes |

---

## 10. Setup, Deployment & Environment Configuration

### Environment Variables (`server/.env`)
```ini
NODE_ENV=production
PORT=5000
DATABASE_URL="postgresql://user:password@host:5432/dbname"
JWT_SECRET="your-256-bit-secret-key"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="*"

# Optional AI Providers (Fallback automatically activates if unset)
GEMINI_API_KEY=""
OLLAMA_BASE_URL="http://localhost:11434"
```

### Build & Run Commands
```bash
# Install dependencies
npm install

# Run frontend + backend concurrently
npm run dev

# Production build
npm run build

# Start production server
npm start
```

---

*Barangay Burgos Digital Governance System • Technical Documentation Version 3.0 • 2026*
