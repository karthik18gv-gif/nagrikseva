# 🏛️ NagrikSeva — Government Citizen Services & Pension Management Portal

Full-stack government e-governance portal built for citizens to apply for government certificates and for retired government employees to manage pension applications.

**Developed by:** Karthik G V
**Institution:** Community Institute of Management Studies (CIMS), Bangalore City University
**Project Type:** MCA Major Project

---

## Overview

NagrikSeva digitizes two core government workflows:

1. **Citizen Certificate Services** — Citizens apply online for Birth, Income, Caste, Domicile, Residence, Death, Senior Citizen, and Disability certificates, track status in real time, and download approved certificates.
2. **Government Employee Pension Services** — Retired government employees apply for pension through a multi-stage approval workflow (HR → Finance → Admin).

### User Roles

| Role | Description |
|---|---|
| 👤 Citizen | Registers, applies for certificates, tracks applications, downloads certificates |
| 💼 Government Employee | Verifies citizen documents, applies for own pension |
| 🏢 Department Officer | Approves/rejects verified applications, generates certificates, reviews pension |
| 🔐 Admin | Manages all users, departments, certificate types, announcements, reports |

---

## Technology Stack

**Frontend:** React 18 (Vite), React Router DOM, Tailwind CSS, Axios, React Icons, React Hot Toast
**Backend:** Node.js, Express.js (MVC)
**Database:** MySQL
**Auth:** JWT + bcrypt
**Uploads:** Multer

---

## Project Structure

```
nagrikseva/
├── frontend/            React + Vite app (components, pages, layouts, contexts, services)
├── backend/             Node + Express API (controllers, routes, middlewares, config, utils)
├── database/            schema.sql, seed.sql, generate-passwords.js
├── INSTALLATION.md
├── API_DOCUMENTATION.md
└── README.md
```

---

## Key Features

- Role-based JWT auth across 4 separate login portals
- Multi-step citizen registration with document upload
- 8 pre-configured certificate types
- Full lifecycle: Submit → Verify (Employee) → Approve (Officer) → Certificate Generated
- 4-stage pension workflow: Submit → HR → Finance → Admin Approval
- Real-time application tracking with visual timeline
- In-app notifications for every role
- Admin panel: citizens, employees, officers, departments, certificate types, announcements, FAQs, support tickets, audit logs
- Fully responsive (desktop, tablet, mobile)
- Government-themed UI (blue + orange, no glassmorphism/gaming aesthetics)

---

## Quick Start

See **[INSTALLATION.md](./INSTALLATION.md)** for full setup.

```bash
mysql -u root -p < database/schema.sql
cd backend && npm install
node ../database/generate-passwords.js   # then paste hashes into database/seed.sql
mysql -u root -p < ../database/seed.sql
cp .env.example .env                     # edit DB credentials
npm run dev

# new terminal
cd frontend && npm install && npm run dev
```

Visit **http://localhost:5173**

---

## Default Test Accounts (after seeding with real hashes)

| Role | Username | Password |
|---|---|---|
| Admin | admin | Admin@123 |
| Officer | officer1 / officer2 | Officer@123 |
| Employee | employee1 / employee2 | Employee@123 |

Citizens register their own accounts via the portal.

---

## Documentation

- **[INSTALLATION.md](./INSTALLATION.md)** — step-by-step VS Code setup
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** — full REST API reference
