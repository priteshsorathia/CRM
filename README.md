# CRM - Enterprise Multi-Tenant Business Management & POS Platform

A modern, full-stack, multi-tenant enterprise business management system and smart POS suite built with **Next.js, Node.js, Express, PostgreSQL, and Prisma ORM**. The platform provides end-to-end operational software tailored for **Retailers**, **Restaurants**, and **Service-based Agencies**, alongside a centralized **Seller Administration Portal**.

---

## 🏗️ System Architecture

The repository is structured into two core ecosystems:

```text
d:\Training\CRM\
├── CRM-Main/                      # Core Multi-Tenant Business Operating System
│   ├── crm-frontend/              # Next.js App Router POS, Dashboard & Client UI (Port 3000)
│   └── crm-backend/               # Express.js REST API & Prisma Engine (Port 8001)
│
└── CRM-Seller/                    # Platform Management & Merchant Portal
    ├── frontend/                  # Next.js Merchant Administration Dashboard (Port 3001)
    └── backend/                   # Express.js Seller & Lead Processing API (Port 5050)
```

---

## 🚀 Key Modules & Capabilities

### 1. 🛒 Retail POS & Smart Inventory (`CRM-Main`)
* **POS Checkout**: Lightning-fast sales counter with real-time barcode scanning, item search, and dynamic discount calculations.
* **Smart Inventory**: Multi-unit stock management, low-stock threshold alerts, category breakdowns, and purchase bill auditing.
* **Invoicing & Receipts**: Instant thermal and PDF invoice generation with tax summaries, customer ledger tracking, and payment recording.
* **Payment Plans**: Flexible installment plans and customer credit ledger management.

### 2. 🍽️ Restaurant Management (`CRM-Main`)
* **Interactive Table Floorplan**: Real-time table status tracking (Vacant, Occupied, Billed, Reserved).
* **Kitchen Order Ticket (KOT)**: Kitchen display stream routing orders directly from waitstaff to chefs with audio/visual status indicators.
* **Menu Management**: Categorized food items, customizable modifiers/add-ons, and combo meals.

### 3. 💼 Services & Agency ERP (`CRM-Main`)
* **Client CRM**: Comprehensive client directories, communication history, and custom engagement records.
* **Project & Task Tracking**: Milestone monitoring, employee assignment, and deadline tracking.
* **Timesheets & Billing**: Service hours logging and direct-to-invoice billing conversion.
* **Accounting Sheets**: Automated journal entries, profit/loss overviews, and fiscal period tracking.

### 4. 👥 HRMS & Workforce Management (`CRM-Main`)
* **Attendance & Biometrics**: Digital employee clock-in/clock-out tracking with shift scheduling.
* **Leave Management**: Employee leave requests with manager/owner approval workflows.
* **Automated Payroll**: Salary calculations, deductions, bonuses, and downloadable monthly pay slips.

### 5. 🏢 Platform Administration & Merchant Portal (`CRM-Seller`)
* **Merchant Onboarding**: Application intake, business verification documents (Tax ID, Licenses), and approval pipelines.
* **Lead Management**: Public lead capture pipelines with status lifecycle tracking (`New`, `Contacted`, `Qualified`, `Lost`).
* **Support Helpdesk**: Unified intake for support tickets and callback scheduling.
* **Review Moderation**: Customer feedback management and review approval workflows.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Applications** | Next.js (App Router), React 19, Tailwind CSS, Lucide Icons, Sonner |
| **Data Visualization** | Chart.js, Recharts, React-Chartjs-2 |
| **Backend APIs** | Node.js, Express.js (RESTful architecture), Prisma ORM |
| **Database** | PostgreSQL with strict relational modeling and tenant-scoped queries |
| **Authentication & Security** | Stateless JWT (JSON Web Tokens), bcryptjs password hashing, RBAC |
| **Document & Communication** | PDFKit (custom invoice generation), Nodemailer (SMTP dispatch) |

---

## ⚙️ Getting Started & Local Setup

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **PostgreSQL**: v14.0.0 or higher running on `localhost:5432`
* **Package Manager**: `npm` (v9+)

---

### Step 1: Environment Configuration

Copy the example environment files in all four project directories:

```bash
# CRM-Main
cp CRM-Main/crm-frontend/.env.example CRM-Main/crm-frontend/.env
cp CRM-Main/crm-backend/.env.example CRM-Main/crm-backend/.env

# CRM-Seller
cp CRM-Seller/frontend/.env.example CRM-Seller/frontend/.env
cp CRM-Seller/backend/.env.example CRM-Seller/backend/.env
```

Ensure your PostgreSQL connection strings in `crm-backend/.env` and `seller-backend/.env` match your local database credentials.

---

### Step 2: Database Initialization & Seeding

```bash
# Initialize CRM-Main Database
cd CRM-Main/crm-backend
npm install
npm run db:push
npm run db:seed

# Initialize CRM-Seller Database
cd ../../CRM-Seller/backend
npm install
npm run db:dev
npm run db:seed
```

---

### Step 3: Running the Applications

Open separate terminal windows for each service:

#### 1. CRM-Main Backend (API: `http://localhost:8001`)
```bash
cd CRM-Main/crm-backend
npm run dev
```

#### 2. CRM-Main Frontend (Web: `http://localhost:3000`)
```bash
cd CRM-Main/crm-frontend
npm run dev
```

#### 3. CRM-Seller Backend (API: `http://localhost:5050`)
```bash
cd CRM-Seller/backend
npm run dev
```

#### 4. CRM-Seller Frontend (Web: `http://localhost:3001`)
```bash
cd CRM-Seller/frontend
npm run dev
```

---

## 🔑 Default Test Credentials

### CRM-Seller Portal (`http://localhost:3001/login`)
| Role | Identifier / Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `crm_owner` / `admin@crm-platform.local` | `Admin@123` |

### CRM-Main Application (`http://localhost:3000/auth/login`)
| Vertical | Role | Username / Identifier | Password | Default Redirect |
| :--- | :--- | :--- | :--- | :--- |
| **Retail** | Shop Owner | `crm.owner.retail` | `Admin@123` | `/dashboard` |
| **Retail** | Store Manager | `crm.manager.retail` | `Emp@1234` | `/dashboard` |
| **Retail** | Sales Cashier | `crm.staff.retail` | `Emp@5678` | `/dashboard` |
| **Restaurant** | Restaurant Owner | `crm.owner.restaurant` | `Admin@123` | `/restaurant` |
| **Restaurant** | Shift Manager | `crm.manager.restaurant` | `Emp@1234` | `/restaurant/hrms` |
| **Restaurant** | Service Staff | `crm.staff.restaurant` | `Emp@5678` | `/restaurant/hrms` |
| **Services** | Agency Owner | `crm.owner.services` | `Admin@123` | `/services` |

---

## 🛡️ Security & Tenant Isolation

* **Tenant Isolation**: Every database query strictly filters by `shopId` or `userId` extracted securely from validated JWT session payloads.
* **Server-Side Authorization**: API routes protect against unauthorized cross-tenant data access through layered permission guards.
* **Zero Secrets in Git**: All `.env` files and local sensitive credentials are automatically ignored via `.gitignore`.

