# Enterprise Business Management & POS Platform

Full-stack multi-tenant ERP and point-of-sale system built with Next.js, Node.js/Express, PostgreSQL, and Prisma. The platform supports three business verticals (Retail, Restaurant, and Services) under a shared architecture, paired with an administrative portal for merchant onboarding and lead tracking.

## Architecture

The project is organized into two primary applications:

```text
├── CRM-Main/
│   ├── crm-frontend/        # Next.js App Router UI (POS, KOT, ERP dashboard) - port 3000
│   └── crm-backend/         # Express REST API with Prisma ORM - port 8001
│
└── CRM-Seller/
    ├── frontend/            # Merchant & seller management portal - port 3001
    └── backend/             # Seller backend & onboarding service - port 5050
```

## Features

### Retail POS & Inventory (CRM-Main)
- Barcode scanning, cart operations, dynamic discounts, and cash/card checkout.
- Multi-unit inventory tracking, low-stock alerts, supplier bills, and category management.
- Thermal and PDF receipt/invoice generation via PDFKit.
- Customer ledgers, store credit, and installment tracking.

### Restaurant Management (CRM-Main)
- Live floorplan with table occupancy states (Vacant, Occupied, Billed, Reserved).
- Kitchen Order Ticket (KOT) workflow routing orders from waiters to kitchen screens.
- Menu configuration with modifiers, add-ons, and combo items.

### Service Agency ERP (CRM-Main)
- Client directory with interaction history and project tracking.
- Task assignments, milestone deadlines, and employee work logs.
- Timesheet logging with one-click conversion to billable invoices.
- Basic accounting ledger with expense tracking and P&L summaries.

### HRMS & Payroll (CRM-Main)
- Daily clock-in/out tracking and shift scheduling.
- Leave request and approval workflows.
- Automated payroll runs with tax/deduction calculations and payslip downloads.

### Platform Administration (CRM-Seller)
- Merchant registration, business verification document review, and approvals.
- Lead intake pipeline with stage tracking (New, Contacted, Qualified, Lost).
- Customer support ticket handling and callback request queues.
- Feedback and review moderation.

## Tech Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS, Lucide, Chart.js / Recharts
- **Backend:** Node.js, Express, Prisma ORM
- **Database:** PostgreSQL (multi-tenant schema using scoped `shopId` queries)
- **Auth:** Stateless JWT authentication, role-based access control, bcrypt password hashing
- **Utilities:** PDFKit (invoices), Nodemailer (email dispatch)

## Setup & Running Locally

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally (default port 5432)
- npm

### 1. Environment files
Set up `.env` files in each subproject based on the required configs:

```bash
# CRM-Main
cp CRM-Main/crm-frontend/.env.example CRM-Main/crm-frontend/.env
cp CRM-Main/crm-backend/.env.example CRM-Main/crm-backend/.env

# CRM-Seller
cp CRM-Seller/frontend/.env.example CRM-Seller/frontend/.env
cp CRM-Seller/backend/.env.example CRM-Seller/backend/.env
```

Ensure `DATABASE_URL` in both backend `.env` files points to your Postgres instance.

### 2. Database setup & seeds

Run migrations and seed default data for both backends:

```bash
# Main backend
cd CRM-Main/crm-backend
npm install
npm run db:push
npm run db:seed

# Seller backend
cd ../../CRM-Seller/backend
npm install
npm run db:dev
npm run db:seed
```

### 3. Start development servers

Run each service in a separate terminal:

```bash
# CRM-Main Backend (http://localhost:8001)
cd CRM-Main/crm-backend && npm run dev

# CRM-Main Frontend (http://localhost:3000)
cd CRM-Main/crm-frontend && npm run dev

# CRM-Seller Backend (http://localhost:5050)
cd CRM-Seller/backend && npm run dev

# CRM-Seller Frontend (http://localhost:3001)
cd CRM-Seller/frontend && npm run dev
```

## Default Seed Accounts

### Seller Portal (`http://localhost:3001/login`)
- **Admin:** `admin@crm-platform.local` / `Admin@123` (Username: `crm_owner`)

### Main Application (`http://localhost:3000/auth/login`)
- **Retail Owner:** `crm.owner.retail` / `Admin@123`
- **Retail Manager:** `crm.manager.retail` / `Emp@1234`
- **Retail Staff:** `crm.staff.retail` / `Emp@5678`
- **Restaurant Owner:** `crm.owner.restaurant` / `Admin@123`
- **Restaurant Manager:** `crm.manager.restaurant` / `Emp@1234`
- **Restaurant Staff:** `crm.staff.restaurant` / `Emp@5678`
- **Services Owner:** `crm.owner.services` / `Admin@123`

## Security & Multi-Tenancy

- Every operational query is strictly filtered by tenant `shopId` derived from the validated JWT token on the server side.
- Client requests cannot read or mutate data belonging to other shops.
- Sensitive files, keys, and `.env` configs are excluded from version control via `.gitignore`.
