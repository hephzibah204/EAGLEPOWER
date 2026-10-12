# Eagle Power Schools (EduCore) — Backend API Documentation 🦅🛡️

The **Eagle Power EduCore Backend** is a secure, modern RESTful API designed to replace the compromised legacy CodeIgniter/PHP school portal (`portal.eaglepowerschools.com.ng`). It restores and migrates all 96+ authentic student, staff, class, and fee records from `eaglepow_schoolportal.sql`, and powers both the public website and the student/parent portals.

---

## 1. Security Architecture & Anti-Hacking Guardrails

| Security Vector | Legacy PHP / CodeIgniter Portal (Hacked) | EaglePower EduCore (Node.js API) |
| :--- | :--- | :--- |
| **Server-Side Execution** | Monolithic PHP execution allowed `.php` web shells in `/uploads/` | **Decoupled Architecture**: Node.js does not execute PHP scripts; files are strictly validated. |
| **Password Storage** | Plaintext credentials in MySQL table | **Bcrypt Hashed**: Cost factor 10, irreversible salt, zero plaintext storage. |
| **SQL Queries** | Vulnerable string concatenation | **Strict Parameterization**: Native SQLite WAL with foreign keys enforced. |
| **HTTP Headers** | Default Apache / cPanel headers | **Helmet Hardened**: CSP, HSTS, X-Content-Type-Options, X-Frame-Options. |
| **Rate Limiting** | None (prone to credential brute-force) | **Express Rate Limit**: 30 login requests / 15 min per IP; 500 requests / 15 min on API. |
| **Audit Logs** | Minimal / file logs overwritten | **Immutable Audit Trail**: All grade entries, logins, and admissions logged to DB. |

---

## 2. Quick Start Guide

### 2.1 Prerequisites
- **Node.js**: v22+ or v24+ (utilizes native `node:sqlite`)
- **Port**: 5050 (configurable in `.env`)

### 2.2 Installation & Database Migration
```bash
cd server
npm install

# Run database migration (ingests 96 real students & historical classes from SQL dump)
npm run migrate

# Start development server
npm run dev

# Run automated API test suite (13 integration tests)
node src/scripts/testApi.js
```

---

## 3. Core API Endpoints

### 3.1 Authentication (`/api/auth`)
* `POST /api/auth/login`: Authenticate with username/admission number & password. Returns JWT token.
  * **Default Admin**: `admin` / `EagleAdmin2025!`
  * **Default Bursar**: `bursar` / `Bursar2025!`
  * **Default Teacher**: `teacher` / `Teacher2025!`
  * **Migrated Student**: `ESE2009012` / `Eagle2025!`
* `GET /api/auth/me`: Retrieve current authenticated profile.
* `POST /api/auth/change-password`: Update password securely.

### 3.2 Academics (`/api/academics`)
* `GET /api/academics/classes`: Lists 16 classes (Nursery, Primary, Junior & Senior College) with enrolled student counts and tuition fees.
* `GET /api/academics/sections`: Lists class streams (A, B, C, Science, Art, Commercial).
* `GET /api/academics/subjects`: Lists 27 curriculum subjects (Mathematics, English, Igbo, ICT, Diction, etc.).

### 3.3 Student Management (`/api/students`)
* `GET /api/students`: Search students by query `q`, filter by `class_id` or `section_id`.
* `GET /api/students/lookup/:admissionNo`: Quick portal lookup by admission number (e.g. `/api/students/lookup/ESE2009012`).
* `GET /api/students/:id`: Full student bio-data, marks, and invoices.
* `POST /api/students`: Enroll new student (Admin only).

### 3.4 Examination & E-Report Cards (`/api/exams`)
* `GET /api/exams/report-card/:admissionNo`: Official termly E-Report Card featuring:
  * Official Eagle Power crest and government approval numbers (College: 04060088, Primary: 04060089).
  * Auto-calculated Class Position (e.g. `1st out of 28 Pupils`).
  * Total scores, averages, affective domain ratings, and principal/teacher remarks.
* `POST /api/exams/marks`: Record single subject score (CA max 30, Exam max 70).
* `POST /api/exams/marks/batch`: Batch mark entry for whole classes.

### 3.5 Bursary & Finance (`/api/finance`)
* `GET /api/finance/stats`: Total invoiced, collected, outstanding debt, and payment breakdown.
* `GET /api/finance/invoices`: List fee invoices.
* `POST /api/finance/invoices`: Generate fee invoice.
* `POST /api/finance/payments`: Record payment receipt (Bank Transfer, Moniepoint, Cash).

### 3.6 Online Admissions (`/api/admissions`)
* `POST /api/admissions/apply`: Public submission endpoint from the online admission form.
* `GET /api/admissions/:appNo`: Public tracking of applicant screening status.
* `PATCH /api/admissions/:id/status`: Update applicant status (`Screening Scheduled`, `Admitted`).

### 3.7 Front Desk & Reception (`/api/frontdesk`)
* `GET /api/frontdesk/stats`: Real-time reception metrics (visitors in campus, active enquiries, pending complaints).
* `GET /api/frontdesk/visitors`: List of campus visitors with filter by `status='In Campus'`.
* `POST /api/frontdesk/visitors`: Check-in visitor, assign security badge, and issue pass (`VIS-2025-XXX`).
* `PATCH /api/frontdesk/visitors/:id/checkout`: Stamp check-out time and update status to `Checked Out`.
* `GET /api/frontdesk/enquiries`: Log of admission walk-ins, parent referrals, and follow-up dates.
* `POST /api/frontdesk/enquiries`: Register new prospective parent inquiry lead.
* `GET /api/frontdesk/calls` & `POST /api/frontdesk/calls`: Front desk telephone call logs and messages.
* `GET /api/frontdesk/dispatch` & `POST /api/frontdesk/dispatch`: Postal and courier dispatch/receive registers.
* `GET /api/frontdesk/complaints` & `PATCH /api/frontdesk/complaints/:id/resolve`: Parent feedback and resolution tracking.

### 3.8 Security & Diagnostics (`/api/audit`)
* `GET /api/audit/security-status`: System security health and mitigation metrics.
* `GET /api/audit/logs`: View administrative action audit trail.
