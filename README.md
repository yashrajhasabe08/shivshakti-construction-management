# Shivshakti Construction Management System (ERP)

A multi-site construction management ERP web application built for remote partners, commercial clients, and site workers.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Recharts, SheetJS (XLSX).
- **Backend:** Node.js, Express, JWT (JSON Web Tokens), Bcryptjs, CORS.
- **Database & ORM:** Prisma ORM, PostgreSQL (Neon / Supabase cloud ready or local), with resilient JSON fallback.

---

## Key Features

1. **Executive Multi-Partner Overview:**
   - 3-Partner Portfolio separation (Rajesh Patel - Pune/Kolhapur, Suresh Sharma - Mumbai, Vikram Deshmukh - Nagpur).
   - Consolidated financials vs. individual partner portfolios.

2. **Hierarchical Projects & Site Ledger:**
   - Structured hierarchy: `District > Division/Taluka > Site`.
   - In-place site expense recording and itemized deletions.

3. **Logistics & Delivery Tracker:**
   - Real-time vehicle dispatch stepper (Ordered, Dispatched, In-Transit, Delivered, Verified).
   - Gate notes and driver direct dial.

4. **Dedicated Portals:**
   - **Admin/Partner ERP:** Full access to projects, expenses, bills, labour wages, subcontractors, and assets.
   - **Corporate Client Portal:** Milestone tracking and verified payment receipts.
   - **Site Worker / Driver Portal:** 1-click status updates and wage slip summaries.

5. **Reporting & Excel Generation Suite:**
   - Executive multi-tab Master Excel export.
   - Dedicated individual partner dossiers (`.xlsx`).

6. **Enterprise Authentication & Authorization:**
   - Salted Bcrypt password hashing.
   - 24-hour signed JWT session tokens.
   - Role-Based Access Control (RBAC).

---

## Quick Start Guide

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set your `DATABASE_URL` (from Neon, Supabase, or local PostgreSQL) and your `JWT_SECRET`.

### 3. Run Database Migrations & Seed (Optional for PostgreSQL)

```bash
npx prisma generate
npx prisma db push
node prisma/seed.cjs
```

### 4. Start Development Servers

Start the backend API server (Port 5001):
```bash
npm run server
```

In another terminal, start the frontend Vite app (Port 3000):
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Default Corporate Test Accounts

| Role | Email | Password | Scope |
|---|---|---|---|
| **Managing Partner (P1)** | `rajesh@shivshakti.com` | `rajesh123` | Pune & Kolhapur Sites |
| **Partner (P2)** | `suresh@shivshakti.com` | `suresh123` | Mumbai High-Rise Sites |
| **Partner (P3)** | `vikram@shivshakti.com` | `vikram123` | Nagpur Earthwork Sites |
| **Corporate Client** | `client@apexinfa.com` | `client123` | Apex Infrastructures Portal |
| **Worker / Driver** | `driver@shivshakti.com` | `driver123` | Vehicle MH 12 QG 4821 Portal |
