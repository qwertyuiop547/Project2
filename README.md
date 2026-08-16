# Barangay Portal

A modern community management system built with React, Node.js, and PostgreSQL.

## 🚀 Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL with Prisma ORM
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Styling**: Custom CSS with Glassmorphism design

## 📦 Project Structure

```
Project2-main/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utilities (API, Auth)
│   │   └── index.css       # Global styles
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth middleware
│   │   └── index.js        # Server entry
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.js         # Seed data
│   └── package.json
└── package.json            # Root package.json
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL installed and running
- npm or yarn

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Database

1. Create a PostgreSQL database:
```sql
CREATE DATABASE barangay_portal;
```

2. Update `server/.env` with your database credentials:
```
DATABASE_URL="postgresql://username:password@localhost:5432/barangay_portal"
```

### 3. Run Database Migrations

```bash
cd server
npx prisma migrate dev --name init
npm run db:seed
```

### 4. Start Development Servers

```bash
# From root directory
npm run dev
```

This starts both:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## 🔐 Test Accounts

After seeding, use these accounts:

| Role | Email | Password |
|------|-------|----------|
| Chairman | chairman@barangay.gov.ph | password123 |
| Secretary | secretary@barangay.gov.ph | password123 |
| Resident | resident@example.com | password123 |

## ✨ Features

- **Authentication**: JWT-based login/register with role-based access
- **Complaints**: File, track, and manage community complaints
- **Suggestions**: Submit ideas and vote for community suggestions
- **Announcements**: View barangay news and updates
- **Services**: Request certificates and documents
- **Dashboard**: Role-based dashboards with stats and activity

## 📱 API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Complaints
- `GET /api/complaints` - List complaints
- `POST /api/complaints` - Create complaint
- `GET /api/complaints/:id` - Get complaint details
- `PATCH /api/complaints/:id/status` - Update status (officials)

### Suggestions
- `GET /api/suggestions` - List suggestions
- `POST /api/suggestions` - Create suggestion
- `POST /api/suggestions/:id/vote` - Vote/unvote

### Announcements
- `GET /api/announcements` - List published announcements

### Services
- `GET /api/services/categories` - List service categories
- `POST /api/services/:id/request` - Request a service

## 🎨 Design

The UI features a premium dark theme with:
- Glassmorphism effects
- Gradient accents
- Smooth animations
- Responsive design

---

Built with ❤️ for the community
