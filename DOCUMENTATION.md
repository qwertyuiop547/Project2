# 🏛️ Barangay Burgos e-Services & AI Governance Portal
## Comprehensive System & AI Features Documentation

> **Official Barangay Digital Management System**  
> *Modern, transparent, secure, and AI-powered civic governance for Barangay Burgos.*  
> **Live Production URL:** [https://barangay-portal-jqxc.onrender.com/](https://barangay-portal-jqxc.onrender.com/)  
> **Repository:** [GitHub - qwertyuiop547/Project2](https://github.com/qwertyuiop547/Project2.git)

---

## 📑 Table of Contents
1. [System Overview & Architecture](#1-system-overview--architecture)
2. [Key User Roles & Access Control](#2-key-user-roles--access-control)
3. [🤖 Deep Dive: AI-Powered Features](#3--deep-dive-ai-powered-features)
   - [3.1 AI Architecture & Multi-Provider Engine](#31-ai-architecture--multi-provider-engine)
   - [3.2 AI Complaint Assistant & Auto-Refinement](#32-ai-complaint-assistant--auto-refinement)
   - [3.3 AI Barangay Chatbot (Real-time SSE Streaming)](#33-ai-barangay-chatbot-real-time-sse-streaming)
   - [3.4 Smart Keyword & NLP Classification Rules](#34-smart-keyword--nlp-classification-rules)
4. [Core Civic Modules & User Features](#4-core-civic-modules--user-features)
   - [4.1 Modern Civic Homepage](#41-modern-civic-homepage)
   - [4.2 Authentication & Security](#42-authentication--security)
   - [4.3 Resident Service Dashboard](#43-resident-service-dashboard)
   - [4.4 Official / Admin Governance Dashboard](#44-official--admin-governance-dashboard)
   - [4.5 Complaints & Incident Management](#45-complaints--incident-management)
   - [4.6 Community Suggestions & Idea Portal](#46-community-suggestions--idea-portal)
   - [4.7 Document & Certificate Processing](#47-document--certificate-processing)
   - [4.8 Official Announcements & News](#48-official-announcements--news)
5. [Accessibility & Inclusive Design](#5-accessibility--inclusive-design)
6. [API Specification & Endpoints](#6-api-specification--endpoints)
7. [Database Schema (Prisma ORM)](#7-database-schema-prisma-orm)
8. [Setup, Deployment & Environment Variables](#8-setup-deployment--environment-variables)

---

## 1. System Overview & Architecture

The **Barangay Burgos Portal** is a full-stack digital civic platform built to replace slow, paper-heavy barangay desk processes with an automated, 24/7 self-service portal.

### Tech Stack
```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Frontend SPA)                    │
│    React 18 + Vite 5 + Zustand + TanStack Query + CSS3      │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON / SSE (REST API)
┌──────────────────────────────▼──────────────────────────────┐
│                    SERVER (Backend API)                     │
│    Node.js + Express 4 + JWT Security + Bcrypt + Multer     │
└──────────────┬──────────────────────────────┬───────────────┘
               │ Prisma ORM                   │ AI Integration
┌──────────────▼──────────────┐ ┌─────────────▼───────────────┐
│     PostgreSQL Database     │ │    AI Intelligence Layer    │
│  Prisma 5 + Relational DB   │ │ Ollama / Gemini / Smart-Eng │
└─────────────────────────────┘ └─────────────────────────────┘
```

---

## 2. Key User Roles & Access Control

The portal enforces strict **Role-Based Access Control (RBAC)** across 3 primary roles:

| Role | Target Users | Key Capabilities & Permissions |
| :--- | :--- | :--- |
| 👤 **RESIDENT** | Barangay Residents & Constituents | File complaints, use AI Complaint Assistant, request documents/clearances, submit community suggestions, talk with Barangay Chatbot, track filing progress in real-time. |
| 📋 **SECRETARY** | Barangay Secretary & Admin Staff | Review incoming complaints, update incident status, issue official certificates, manage indigent records, publish barangay announcements. |
| 🏛️ **CHAIRMAN** | Punong Barangay / Captain | Full governance overview, view community analytics & resolution rates, review escalated disputes (Lupon Tagapamayapa), approve official policies. |

### Pre-Seeded Demo Accounts
- **Resident**: `resident@example.com` / `password123`
- **Secretary**: `secretary@barangay.gov.ph` / `password123`
- **Chairman**: `chairman@barangay.gov.ph` / `password123`

---

## 3. 🤖 Deep Dive: AI-Powered Features

The platform features an intelligent, multi-layered Artificial Intelligence system designed specifically for **Philippine local governance (Barangay level)**.

```
                         ┌─────────────────────────────┐
                         │    Incoming User Request    │
                         └──────────────┬──────────────┘
                                        │
                         ┌──────────────▼──────────────┐
                         │   AI Provider Router        │
                         │   (Dynamic Provider Check)  │
                         └──────┬──────────────┬───────┘
                                │              │
            ┌───────────────────▼──┐        ┌──▼──────────────────┐
            │   Local / Cloud LLM  │        │ Smart Assist Engine │
            │   • Ollama (Local)   │        │ (Zero-dependency    │
            │   • Google Gemini    │  ───►  │ Rule & NLP Pattern  │
            │   • Groq / OpenAI    │        │ Fallback System)    │
            └──────────────────────┘        └─────────────────────┘
```

---

### 3.1 AI Architecture & Multi-Provider Engine
The system uses a flexible, multi-tiered AI pipeline defined in `server/src/services/ai.js`:

1. **Local Open-Source LLM (Ollama)**: Connects to local or private Ollama instances (`llama3.2:1b`, `llama3:8b`, or `mistral`) for 100% private, free on-premise execution.
2. **Cloud APIs**: Supports Google Gemini (`GEMINI_API_KEY`), Groq (`GROQ_API_KEY`), or OpenAI (`OPENAI_API_KEY`).
3. **Smart Assist Engine (Built-in Fallback)**: If no LLM or cloud API key is available or if network connectivity drops, the system seamlessly activates its zero-dependency rule engine. It performs localized Tagalog text parsing, keyword stemming, and report synthesis without failing.

---

### 3.2 AI Complaint Assistant & Auto-Refinement

When a resident enters an informal, fragmented, or emotionally stressed complaint (e.g. *"sobrang ingay sa kanto namin di makatulog mga tao"*), the AI assistant transforms it into an **official, actionable barangay report**:

#### Key Capabilities:
1. **Intelligent Categorization**: Detects whether the issue belongs to `Infrastructure`, `Sanitation`, `Public Safety`, `Noise & Disturbance`, or `Others`.
2. **Priority Assessment**: Assigns priority (`URGENT`, `HIGH`, `MEDIUM`, `LOW`) based on hazard keywords and context.
3. **Formal Tagalog Synthesis**: Polishes raw complaints into courteous, formal Tagalog suitable for barangay hearings and records.
4. **Preserves Facts**: Strictly retains location names, landmark clues, and timestamps while removing vulgarity or clutter.

#### Example Transformation:
```json
// INPUT (Resident text):
{
  "description": "may butas kalsada tapat ng tindahan ni aling nena delikado sa motor baha pa",
  "location": "Purok 3, tapat ng Nena Store"
}

// AI OUTPUT:
{
  "title": "Lubak at Pagbaha sa Kalsada sa Purok 3",
  "description": "Nais kong i-report ang malaking butas sa kalsada sa tapat ng Nena Store sa Purok 3 na nagdudulot ng panganib sa mga nagmomotor at nagiging sanhi ng pagbaha. Humihiling po kami ng agarang aksyon mula sa barangay.",
  "categoryName": "Infrastructure",
  "priority": "HIGH",
  "explanation": "Inayos ang detalye at inilagay sa kategoryang Imprastraktura na may High priority dahil sa banta sa kaligtasan."
}
```

---

### 3.3 AI Barangay Chatbot (Real-time SSE Streaming)

Located conveniently in the lower corner of the portal, the **Barangay AI Assistant** provides immediate answers to citizen questions.

#### Core Chatbot Features:
- **Real-Time Token Streaming (Server-Sent Events / SSE)**: Delivers smooth, typewriter-style output instantly to the resident.
- **Dynamic Context Injection**: The backend injects real-time barangay metadata into the system prompt:
  - All official barangay services, processing fees, and requirements.
  - Estimated processing days for clearances and permits.
  - The logged-in resident's active complaints and progress status.
- **Bilingual Conversational Flow**: Responds fluently in Tagalog, English, or Taglish.
- **Smart FAQ Fast-Path**: Instantly answers frequently asked questions (such as clearance fees, office hours, and hotline numbers) in `< 20ms`.

---

### 3.4 Smart Keyword & NLP Classification Rules

The NLP engine matches and categorizes complaints using curated Tagalog civic dictionaries:

```javascript
// Sample Keyword Mappings in server/src/services/ai.js
const CATEGORY_KEYWORDS = {
    Infrastructure: ['pothole', 'road', 'kalsada', 'butas', 'street', 'drainage', 'poste', 'baha', 'flood', 'tulay'],
    Sanitation: ['garbage', 'basura', 'trash', 'waste', 'smell', 'mabaho', 'collection', 'kalat', 'dumi'],
    'Public Safety': ['crime', 'theft', 'security', 'lighting', 'unsafe', 'krimen', 'nakawan', 'delikado', 'ilaw', 'holdap'],
    'Noise & Disturbance': ['noise', 'loud', 'music', 'karaoke', 'ingay', 'maingay', 'videoke', 'tambay', 'gulo']
};

const PRIORITY_KEYWORDS = {
    URGENT: ['urgent', 'emergency', 'danger', 'delikado', 'agad', 'critical', 'injury', 'fire', 'sunog', 'aksidente'],
    HIGH: ['high', 'mataas', 'serious', 'immediate', 'matagal', 'linggo', 'week'],
    LOW: ['minor', 'maliit', 'cosmetic', 'kaunti', 'mababa']
};
```

---

## 4. Core Civic Modules & User Features

### 4.1 Modern Civic Homepage (`/`)
- **Real-Time Philippine Standard Time Clock**: Displays synchronized government time.
- **Live Status & Time Greeting**: Dynamic *"Magandang Umaga/Hapon/Gabi"* greeting with active status indicator.
- **Civic Stats Ribbon**: Displays key efficiency metrics (24/7 Digital Filing, 24-48h Processing, 98.5% Resolution Rate, 3,500+ Residents).
- **Service Directory & Filter Tabs**: Categorized filter tabs (*Lahat, Clearance & Docs, Tulong, Negosyo, Lupon*) with live search.
- **Emergency Hotlines Bar**: Direct dial numbers for Barangay Desk, Tanod Patrol, Health Center, and Fire/PNP.
- **Interactive FAQ Accordion**: Expandable FAQs for citizen inquiries.

### 4.2 Authentication & Security (`/login`, `/register`)
- **256-Bit SSL/JWT Authentication**: Secure token-based session management.
- **Quick Demo Login Buttons**: 1-click test fill for *Resident*, *Chairman*, and *Secretary*.
- **Live Password Strength Meter**: Animated security score evaluating character complexity.
- **Data Privacy Act of 2012 (R.A. 10173) Consent**: Full compliance with Philippine data privacy regulations.

### 4.3 Resident Dashboard (`/dashboard`)
- Status metric cards for *Pending*, *In Progress*, *Resolved*, and *My Ideas*.
- 4 Quick action cards to file complaints, request documents, share community suggestions, and view announcements.
- Live request history table with click-through tracking.

### 4.4 Official / Admin Dashboard (`/dashboard`)
- 5-Column KPI Analytics Ribbon tracking total complaints, for-action cases, resolution rates, and document loads.
- Quick Services management grid for official workflows.
- Filterable activity table with category, status, and search filters.
- Mini visual analytics for incident breakdown and status distribution.

### 4.5 Complaints & Incident Management (`/complaints`)
- Citizen incident submission with optional anonymous filing.
- Status workflow: `PENDING` ➔ `IN_PROGRESS` ➔ `RESOLVED` / `DISMISSED`.
- Official remarks and update timeline.

### 4.6 Community Suggestions (`/suggestions`)
- Public or authenticated community idea submission.
- Upvoting and community feedback mechanism.
- Official status tagging (`REVIEWING`, `PLANNED`, `COMPLETED`).

### 4.7 Document & Certificate Processing (`/services`)
- Online application for *Barangay Clearance*, *Certificate of Indigency*, *Business Permit*, *Solo Parent Certification*, and *Barangay ID*.
- Automated fee computation and requirements checklist.

### 4.8 Announcements (`/announcements`)
- Official barangay broadcast notices, advisory bulletins, and emergency alerts.

---

## 5. Accessibility & Inclusive Design

The platform meets **WCAG 2.1 AA & AAA standards** for accessibility:

1. **Floating Accessibility Panel (⚙️)**: Located at the bottom-right corner of the screen.
2. **High Contrast Mode (WCAG AAA)**:
   - Switches to pure OLED black background (`#000000`) with high-visibility white text (`#ffffff`), yellow buttons (`#ffff00`), and neon green accents (`#00ff88`).
   - Synced across all pages including Login and Register via `localStorage`.
3. **Dynamic Font Scaling**:
   - `Normal` (100%), `Large` (112%), and `Extra Large` (124%) font scaling for elderly and visually-impaired citizens.
4. **Keyboard Navigation & Screen Reader Support**: Semantic HTML5 landmark tags, `aria-labels`, and high-visibility focus rings.

---

## 6. API Specification & Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new resident account | No |
| `POST` | `/api/auth/login` | Authenticate user & return JWT token | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes (JWT) |
| `GET` | `/api/ai/status` | Check active AI provider status | Yes |
| `POST` | `/api/ai/complaint-assist` | AI complaint categorization & formal rewrite | Yes (Resident) |
| `POST` | `/api/ai/chat` | Send message to Barangay AI Assistant | Yes |
| `POST` | `/api/ai/chat/stream` | Stream realtime AI Assistant responses (SSE) | Yes |
| `GET` | `/api/complaints` | List complaints (filtered by user/role) | Yes |
| `POST` | `/api/complaints` | Create new citizen complaint | Yes |
| `GET` | `/api/services` | List available barangay certificates/services | No |
| `GET` | `/api/announcements` | List official published announcements | No |
| `GET` | `/api/dashboard/stats` | Retrieve dashboard KPI counts & metrics | Yes |
| `GET` | `/api/health` | Healthcheck endpoint for monitoring | No |

---

## 7. Database Schema (Prisma ORM)

```prisma
// Core Models in server/prisma/schema.prisma

enum Role {
  RESIDENT
  SECRETARY
  CHAIRMAN
  ADMIN
}

enum ComplaintStatus {
  PENDING
  IN_PROGRESS
  RESOLVED
  DISMISSED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

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
  id          String           @id @default(uuid())
  title       String
  description String
  location    String?
  priority    Priority         @default(MEDIUM)
  status      ComplaintStatus  @default(PENDING)
  isAnonymous Boolean          @default(false)
  userId      String?
  user        User?            @relation(fields: [userId], references: [id])
  categoryId  String
  category    ComplaintCategory @relation(fields: [categoryId], references: [id])
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
}
```

---

## 8. Setup, Deployment & Environment Variables

### Environment Variables (`server/.env`)
```ini
NODE_ENV=production
PORT=5000
DATABASE_URL="postgresql://user:password@host:5432/dbname"
JWT_SECRET="your-256-bit-secret-key"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="*"

# Optional AI Providers (Fallback automatically handles if unset)
GEMINI_API_KEY=""
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.2:1b"
```

### Local Development Commands
```bash
# Install all dependencies across monorepo
npm install

# Run Frontend + Backend concurrently
npm run dev

# Build for production
npm run build
```

---

*Documentation Version 2.0 • Prepared for Barangay Burgos Digital Governance Project*
