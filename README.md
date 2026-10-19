Enterprise Business Management & POS Platform
A full-stack, multi-tenant business management platform designed for retail stores, restaurants, and service-based businesses. It brings point-of-sale workflows, inventory, invoicing, staff operations, and merchant administration into one system.
The project uses Next.js and React for its interfaces, Node.js and Express for REST APIs, and PostgreSQL with Prisma for data access. A separate seller portal supports merchant onboarding and platform administration.
What the Platform Covers
Area
Capabilities
Retail
POS checkout, barcode scanning, inventory, suppliers, receipts, and customer accounts
Restaurants
Table management, menus, modifiers, and kitchen order tickets (KOT)
Services
Client and project tracking, tasks, timesheets, invoices, and accounting
HR & Payroll
Attendance, shifts, leave requests, payroll runs, and payslips
Platform administration
Merchant registration, verification, leads, support tickets, and feedback moderation
Architecture
The repository contains two application groups, each with a frontend and a backend:
CRM/
├── CRM-Main/
│   ├── crm-frontend/     # Next.js app: POS, restaurant, and ERP interfaces (port 3000)
│   └── crm-backend/      # Express REST API and Prisma data layer (port 8001)
├── CRM-Seller/
│   ├── frontend/         # Next.js merchant administration portal (port 3001)
│   └── backend/          # Express onboarding and administration API (port 5050)
├── .gitignore
└── README.md
The main application serves the retail, restaurant, and service workflows. The seller application handles platform-level merchant operations.
Data Access and Tenant Boundaries
The documented multi-tenant design scopes operational data by shopId, obtained from a validated JWT on the server side. Authentication uses JWTs, password hashing uses bcrypt, and access to functionality is controlled through roles and permissions.
These are implementation design details, not a claim that the system has undergone an independent security audit.
Features
Retail POS & Inventory
Barcode-based product lookup, shopping carts, discounts, and cash/card checkout
Multi-unit stock tracking, low-stock alerts, categories, and supplier bills
Thermal receipts and PDF invoices
Customer ledgers, store credit, and installment tracking
Restaurant Operations
Floorplan with vacant, occupied, billed, and reserved table states
Kitchen Order Ticket (KOT) workflow connecting order entry with kitchen screens
Menus with modifiers, add-ons, and combo items
Service Business Management
Client records and interaction history
Projects, tasks, milestones, and employee work logs
Timesheets with conversion to billable invoices
Expense tracking, accounting ledger, and profit-and-loss summaries
HRMS & Payroll
Clock-in/clock-out and shift scheduling
Leave requests and approvals
Payroll calculations, deductions, and downloadable payslips
Merchant Administration
Merchant registration and business-document verification
Merchant approvals and onboarding
Lead pipeline with stages such as New, Contacted, Qualified, and Lost
Support tickets, callback requests, and feedback moderation
Technology Stack
Layer
Technologies
Frontend
Next.js (App Router), React, Tailwind CSS
Backend
Node.js, Express
Database & ORM
PostgreSQL, Prisma
Authentication & authorization
JWT, bcrypt, role-based access control
UI and charts
Lucide, Chart.js, Recharts
Documents & messaging
PDFKit, Nodemailer
The two application groups have their own package configurations and dependency versions.
Getting Started
Prerequisites
Node.js 18+ (as documented by the project; check the individual apps' dependency requirements)
PostgreSQL 14+
npm
1. Clone the repository
git clone https://github.com/priteshsorathia/CRM.git
cd CRM
2. Configure environment variables
The repository's documented setup uses .env.example files for each application:
cp CRM-Main/crm-frontend/.env.example CRM-Main/crm-frontend/.env
cp CRM-Main/crm-backend/.env.example CRM-Main/crm-backend/.env
cp CRM-Seller/frontend/.env.example CRM-Seller/frontend/.env
cp CRM-Seller/backend/.env.example CRM-Seller/backend/.env
Set DATABASE_URL in each backend's .env to the appropriate PostgreSQL database. Configure any other required variables for the services you intend to run. Do not commit credentials or .env files.
3. Install dependencies and initialize the databases
Run these commands from the repository root:
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
Install frontend dependencies as well:
# From repository root
cd CRM-Main/crm-frontend && npm install
cd ../../CRM-Seller/frontend && npm install
Note: The database commands above are taken from the project's documented setup and checked against the backend package scripts. They have not been executed as part of this README update.
4. Start the applications
Open a separate terminal for each service, starting from the repository root:
cd CRM-Main/crm-backend && npm run dev
cd CRM-Main/crm-frontend && npm run dev
cd CRM-Seller/backend && npm run dev
cd CRM-Seller/frontend && npm run dev
Application
Local address
Main frontend
http://localhost:3000
Main API
http://localhost:8001
Seller frontend
http://localhost:3001
Seller API
http://localhost:5050
Local Development Accounts
The project includes seed scripts for local development accounts, including retail, restaurant, service, and seller administration roles.
Use these accounts only in an isolated local development environment. Seeded credentials are not suitable for a public deployment. Change or disable all default accounts and passwords before deploying the application.
Security Considerations
The repository documents these controls:
JWT-based authentication and role-based authorization
Password hashing with bcrypt
Tenant-scoped data access using shopId
Environment-based configuration, with .env files excluded from version control
For production use, review authorization and tenant isolation on every data-access path, configure secrets securely, disable development credentials, and test authentication and access controls.
Project Status
This repository contains the source code for the main business application and the seller administration portal. The features described above reflect the repository's documentation; this README does not imply that every workflow has been independently tested or that a hosted demo is available.
Repository
Source code: github.com/priteshsorathia/CRM
