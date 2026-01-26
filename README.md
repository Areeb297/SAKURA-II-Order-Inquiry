# SAKURA-II Order Inquiry Form

**Ebttikar Technology × EdgeCortix Partnership**

A professional B2B order inquiry form for SAKURA-II AI accelerator products. Built with Next.js 16, deployed on Vercel, with NeonDB for lead storage and an admin dashboard for lead management.

---

## Features

- **Order Inquiry Form** — Professional enterprise form with inline validation, mobile-responsive design, and UTM tracking
- **Database Storage** — All submissions stored in NeonDB (PostgreSQL) with timestamps and source tracking
- **Email Notifications** — Automatic email to `edgecortix@ebttikar.com` on each submission
- **Admin Dashboard** — Password-protected dashboard to view, filter, search, and manage leads
- **CSV Export** — Export all leads to CSV for Excel/Google Sheets
- **Lead Status Tracking** — Update lead status: New → Contacted → Qualified → Quoted → Closed / Lost
- **UTM Parameter Tracking** — Captures `utm_source`, `utm_medium`, `utm_campaign` from QR codes and links

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 3 |
| UI Components | Radix UI Primitives |
| Database | NeonDB (PostgreSQL 17) |
| Email | Nodemailer (SMTP) |
| Hosting | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+ installed
- NeonDB account with a project
- SMTP credentials for email notifications (optional)

### 1. Clone & Install

```bash
cd sakura-order-form
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
# Database — Use the DIRECT endpoint (not pooler) from NeonDB
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-XXXXX.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require

# Admin Dashboard Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourSecurePassword

# Email (SMTP) — Ask your Ebttikar system admin for these
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=edgecortix@ebttikar.com
SMTP_PASS=your-app-password
SMTP_FROM=edgecortix@ebttikar.com
NOTIFICATION_EMAIL=edgecortix@ebttikar.com
```

> **Important:** Use the **direct endpoint** (without `-pooler` in the hostname) for the DATABASE_URL. The pooler connection is read-only for schema changes.

### 3. Set Up Database

The `edgecortix_leads` table should already be created. If not, you can initialize it from the admin dashboard by clicking "Init DB", or run the setup script:

```bash
npm run db:setup
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the form.

---

## Pages

| URL | Description | Auth Required |
|-----|-------------|---------------|
| `/` | Order inquiry form (public) | No |
| `/thank-you` | Confirmation page after submission | No |
| `/admin` | Lead management dashboard | Yes |

---

## Admin Dashboard

### Accessing the Dashboard

1. Go to `/admin`
2. Enter the credentials set in your `.env.local`:
   - **Username:** Value of `ADMIN_USERNAME`
   - **Password:** Value of `ADMIN_PASSWORD`

### Dashboard Features

- **View all leads** with contact info, products, quantity, and status
- **Search** by name, company, or email
- **Filter** by status (New, Contacted, Qualified, Quoted, Closed, Lost)
- **Update lead status** directly from the table or detail view
- **View full lead details** including UTM tracking data
- **Export to CSV** for Excel analysis

### Lead Status Workflow

```
New → Contacted → Qualified → Quoted → Closed
                                      → Lost
```

---

## Deploying to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-repo.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and import the repository
2. Set the following environment variables in Vercel project settings:
   - `DATABASE_URL`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
   - `NOTIFICATION_EMAIL`
3. Deploy

### 3. Embedding in WordPress

After deploying to Vercel, embed the form in WordPress using an iframe:

```html
<iframe
  src="https://your-vercel-domain.vercel.app"
  width="100%"
  height="1200"
  style="border: none; max-width: 800px; margin: 0 auto; display: block;"
  title="SAKURA-II Order Inquiry"
></iframe>
```

---

## UTM Tracking

Append UTM parameters to the form URL for tracking QR code sources:

```
https://your-domain.vercel.app/?utm_source=qr_code&utm_medium=exhibition&utm_campaign=LEAP_2026
```

Supported parameters:
- `utm_source` — Traffic source (e.g., `qr_code`, `linkedin`, `email`)
- `utm_medium` — Medium (e.g., `exhibition`, `social`, `newsletter`)
- `utm_campaign` — Campaign name (e.g., `LEAP_2026`, `GITEX_2026`)
- `utm_term` — Search term (optional)
- `utm_content` — Content variant (optional)

---

## Email Notifications

Each submission sends an email to `edgecortix@ebttikar.com` with:
- Subject: `[EdgeCortix Lead] Company Name – Product – Qty: X`
- Formatted HTML with contact info, products, business details, and message

### SMTP Setup

Ask your Ebttikar system admin for the SMTP credentials. For Office 365:
- Host: `smtp.office365.com`
- Port: `587`
- Auth: Email + App Password

---

## Database Schema

Table: `edgecortix_leads`

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| id | SERIAL | Auto | Primary key |
| first_name | VARCHAR(100) | Yes | Contact first name |
| last_name | VARCHAR(100) | Yes | Contact last name |
| company_name | VARCHAR(200) | Yes | Company name |
| job_title | VARCHAR(200) | Yes | Job title |
| company_email | VARCHAR(200) | Yes | Email address |
| phone | VARCHAR(50) | Yes | Phone number |
| country | VARCHAR(100) | Yes | Country |
| city | VARCHAR(100) | No | City |
| products | TEXT[] | Yes | Selected products array |
| estimated_quantity | INTEGER | Yes | Order quantity |
| purchase_timeframe | VARCHAR(100) | Yes | Purchase timeline |
| use_case | VARCHAR(100) | Yes | Use case category |
| message | TEXT | No | Additional notes |
| consent | BOOLEAN | Yes | Contact consent |
| status | VARCHAR(20) | Yes | Lead status (default: New) |
| utm_source | VARCHAR(200) | No | UTM source parameter |
| utm_medium | VARCHAR(200) | No | UTM medium parameter |
| utm_campaign | VARCHAR(200) | No | UTM campaign parameter |
| utm_term | VARCHAR(200) | No | UTM term parameter |
| utm_content | VARCHAR(200) | No | UTM content parameter |
| source | VARCHAR(50) | No | Submission source (default: web_form) |
| notes | TEXT | No | Internal notes |
| submission_date | TIMESTAMPTZ | Yes | When submitted |
| updated_at | TIMESTAMPTZ | Yes | Last updated |

---

## Project Structure

```
sakura-order-form/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Order inquiry form
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Global styles
│   │   ├── thank-you/page.tsx    # Thank you confirmation
│   │   ├── admin/page.tsx        # Admin dashboard
│   │   └── api/
│   │       ├── submit/route.ts   # Form submission API
│   │       ├── db-init/route.ts  # Database init endpoint
│   │       └── leads/
│   │           ├── route.ts      # List/search leads API
│   │           ├── [id]/route.ts # Update lead status API
│   │           └── export/route.ts # CSV export API
│   ├── components/ui/            # UI components
│   └── lib/
│       ├── db.ts                 # Database connection
│       ├── email.ts              # Email notifications
│       ├── countries.ts          # Country list
│       └── utils.ts              # Utility functions
├── .env.example                  # Environment template
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```
