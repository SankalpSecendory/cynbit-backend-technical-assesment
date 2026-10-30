# Cynbit Technologies — Backend Technical Audit & Reference Implementation

**Position:** Backend Developer Intern Technical Assessment  
**Applicant:** Sankalp  
**Assessment Title:** Analyze Cynbit From a Backend Perspective  
**Target:** [Cynbit Technologies](https://www.cynbit.in/)  
**Submission Repository:** `cynbit-backend-technical-audit`  

---

## 🚀 Project Overview

This repository contains the complete technical assessment submitted for the **Backend Developer Intern** role at **Cynbit Technologies**. The project is split into two complementary parts:

1. **The Technical Audit & Security Analysis:** A rigorous, evidence-driven passive technical evaluation of Cynbit's production-facing website (`https://www.cynbit.in/`) and internal portal (`https://portal.cynbit.in/`), evaluating API architecture, data validation, database integrity, defensive security headers, authentication, performance, and reliability.
2. **The Inquiry Management Reference API (`reference-api/`):** A fully functional, production-ready backend reference implementation written in **TypeScript**, **Express.js**, **Prisma ORM**, and **PostgreSQL** (with zero-config SQLite support for instant local testing). It demonstrates the concrete resolution of every architectural and security finding identified during the audit.

---

## 📑 Deliverables Directory

| File / Folder | Description |
| :--- | :--- |
| **[`AUDIT_REPORT.md`](AUDIT_REPORT.md)** | **The Flagship Technical Audit Report.** Comprehensive 15-section report covering executive summary, scope, methodology, observable API behavior, security posture, performance baselines, and engineering rationale. |
| **[`FINDINGS.md`](FINDINGS.md)** | **Prioritized Technical Findings.** 8 prioritized findings with CVSS-aligned severity ratings, likelihood, confidence, raw evidence, and concrete remediation code references. |
| **[`METHODOLOGY.md`](METHODOLOGY.md)** | **Passive Reconnaissance Protocol.** Explains ethical constraints, permitted non-intrusive actions, inspection tooling, and evidence classification rules (`[OBSERVED]`, `[INFERRED]`, `[RECOMMENDED]`). |
| **[`FINAL_SUBMISSION_CHECKLIST.md`](FINAL_SUBMISSION_CHECKLIST.md)** | **Final Quality Assurance Checklist.** 32/32 verification checks marked with `PASS` status across code quality, documentation, security, and reproducibility. |
| **[`docs/architecture.md`](docs/architecture.md)** | **System Design Document.** Component-by-component analysis, failure modes, data flow, scaling roadmap, and justification for a Modular Monolith over microservices. |
| **[`docs/diagrams/inquiry-flow.mmd`](docs/diagrams/inquiry-flow.mmd)** | **Inquiry Lifecycle Diagram.** Complete Mermaid sequence diagram illustrating the end-to-end request lifecycle, middleware pipeline, validation, and async email dispatch. |
| **[`docs/evidence-log.md`](docs/evidence-log.md)** | **Reconnaissance Evidence Register.** 12 chronological evidence records with raw HTTP headers, status codes, and client bundle extracts. |
| **[`docs/interview-prep.md`](docs/interview-prep.md)** | **Interview Deep-Dive & Architecture Defense.** In-depth explanations of 17 core engineering foundations and 20 likely interviewer questions with senior-grade answers. |
| **[`reference-api/`](reference-api/)** | **Runnable Backend Implementation.** Clean layered TypeScript/Express backend with Zod validation, Helmet, rate limiting, Pino logging, and automated tests. |

---

## 🏗️ Reference Backend Architecture

```
Client (Web / Mobile / CRM)
         │
         ▼ [HTTPS / JSON]
Reverse Proxy / Gateway (TLS 1.3 Termination)
         │
         ▼
Express Application (Modular Monolith)
 ├── Request Correlation ID (`X-Request-Id`)
 ├── Helmet Security Headers (CSP, Frameguard, NoSniff, HidePoweredBy)
 ├── Restricted CORS Whitelist
 ├── IP Sliding-Window Rate Limiter (5 req / 15 min)
 ├── Body Parser (Strict 10kb Limit)
 ├── Strict Zod Schema Validation (`.strict()`)
 └── Layered Domain Processing
      ├── Inquiry Controller (HTTP serialization & status codes)
      ├── Inquiry Service (Input normalization & business logic)
      │    ├── Async Notification Dispatcher (Resend API simulation)
      │    └── Inquiry Repository (Prisma ORM parameterized queries)
      └── Database Connection Pool (PostgreSQL 16 / SQLite)
```

---

## 🛠️ Technology Stack

- **Runtime & Language:** Node.js v20+ / v24+ with TypeScript (Strict Mode enabled)
- **Web Framework:** Express.js 4.x
- **Data Access & ORM:** Prisma ORM 5.x
- **Database:** PostgreSQL 16 (production) / SQLite (zero-config local test suite)
- **Input Validation:** Zod 3.x (strict schema enforcement)
- **Application Security:** Helmet 8.x, CORS, Express-Rate-Limit 7.x
- **Structured Logging:** Pino 9.x with PII redaction rules
- **Testing Framework:** Vitest 2.x & Supertest 7.x
- **Containerization:** Docker & Docker Compose

---

## 🚦 Quick Start Guide

### 1. Prerequisites
- **Node.js:** v18.0.0 or higher (Node v20 or v24 recommended)
- **npm:** v9.0.0 or higher
- **Git**

### 2. Clone Repository & Install Dependencies
```bash
git clone https://github.com/<your-username>/cynbit-backend-technical-audit.git
cd cynbit-backend-technical-audit/reference-api

# Install dependencies
npm install
```

### 3. Initialize the Database
The reference API uses Prisma with SQLite by default for instant local execution without needing external database daemons:
```bash
# Push the Prisma schema to generate the local SQLite database
npx prisma db push

# Generate the Prisma client
npx prisma generate
```

### 4. Run Automated Tests
Execute the complete integration and unit test suite:
```bash
npm test
```

### 5. Start the Development Server
```bash
npm run dev
```
The server will boot on `http://localhost:3000`.

---

## 📖 API Documentation & Endpoints

### 1. Health & Diagnostics Check
- **Route:** `GET /api/v1/health`
- **Access:** Public
- **Description:** Verifies service uptime, memory footprint, and performs an active database query (`SELECT 1`).
- **Response (HTTP 200 OK):**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-10-31T05:00:00.000Z",
  "services": {
    "database": {
      "status": "connected",
      "latencyMs": 4
    }
  },
  "system": {
    "uptimeSeconds": 120,
    "memoryUsageMb": 38,
    "environment": "development",
    "nodeVersion": "v24.14.0"
  }
}
```

---

### 2. Create Public Inquiry
- **Route:** `POST /api/v1/inquiries`
- **Access:** Public (Rate-limited: 5 requests per 15 minutes per IP)
- **Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "name": "Alex Rivera",
  "email": "alex@example.com",
  "company": "Rivera Tech Labs",
  "industry": "Fintech",
  "message": "We would like to consult on deploying autonomous AI agents for our customer workflow."
}
```
- **Validation Rules:**
  - `name`: string, trimmed, 2–100 characters (Required)
  - `email`: string, trimmed, valid email format, max 254 characters (Required)
  - `company`: string, trimmed, max 120 characters (Optional)
  - `industry`: string, trimmed, max 80 characters (Optional)
  - `message`: string, trimmed, 10–5000 characters (Required)
  - Strict mode enabled: any unexpected or injected properties will trigger an HTTP 400 error.

- **Success Response (HTTP 201 Created):**
```json
{
  "success": true,
  "data": {
    "inquiryId": "cm30a1b2c3d4e5f6g7h8",
    "status": "received",
    "createdAt": "2026-10-31T05:00:00.000Z"
  }
}
```

- **Validation Error Response (HTTP 400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The submitted information is invalid. Please check the provided fields.",
    "details": [
      {
        "field": "email",
        "message": "Please provide a valid email address"
      }
    ],
    "requestId": "7b84f32a-4c28-4f25-8321-df39a3f23921",
    "timestamp": "2026-10-31T05:00:00.000Z"
  }
}
```

---

### 3. List Inquiries (Administrative Protected Route)
- **Route:** `GET /api/v1/inquiries?page=1&limit=10`
- **Access:** Protected (Requires Admin Authentication)
- **Headers:** `Authorization: Bearer cynbit_test_admin_secret_key_2026`
- **Query Parameters:**
  - `page`: integer >= 1 (Default: 1)
  - `limit`: integer 1–50 (Default: 10)
  - `status`: optional enum (`RECEIVED`, `IN_REVIEW`, `CONTACTED`, `RESOLVED`, `ARCHIVED`)
- **Success Response (HTTP 200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cm30a1b2c3d4e5f6g7h8",
      "name": "Alex Rivera",
      "email": "alex@example.com",
      "company": "Rivera Tech Labs",
      "industry": "Fintech",
      "message": "We would like to consult on deploying autonomous AI agents...",
      "status": "RECEIVED",
      "createdAt": "2026-10-31T05:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalCount": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

- **Unauthorized Response (HTTP 401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized access: valid API key or credentials required",
    "requestId": "7b84f32a-4c28-4f25-8321-df39a3f23921",
    "timestamp": "2026-10-31T05:00:00.000Z"
  }
}
```

---

## 🔒 Security Implementations

1. **Strict Content-Security-Policy & Defensive Headers:** Managed via Helmet to prevent XSS, clickjacking (`frameguard: deny`), and MIME-sniffing (`noSniff`).
2. **Framework Fingerprint Neutralization:** `hidePoweredBy` strips `X-Powered-By: Next.js` / Express headers.
3. **CORS Hardening:** Restricts allowed origins to verified domains, disallowing arbitrary cross-origin script interactions.
4. **IP Sliding-Window Rate Limiting:** Enforces 5 requests per 15-minute window on inquiry submissions to neutralize bot floods and spam loops.
5. **Strict 10kb Body Parser Limit:** Rejects oversized JSON payloads before memory allocation can cause buffer exhaustion DoS.
6. **SQL Injection Immunity:** Parameterized driver queries via Prisma ORM guarantee complete separation of query code from user data.
7. **PII Log Redaction:** Structured Pino logger automatically masks `email`, `phone`, `password`, `message`, and `address` fields.
8. **Graceful Shutdown:** Traps `SIGTERM` and `SIGINT`, stops accepting new requests, drains in-flight queries within 10 seconds, and safely closes the database connection pool.

---

## 🐳 Docker & Production Deployment

For full production deployment with **PostgreSQL 16**:
```bash
cd reference-api
docker compose up --build -d
```
This spins up:
- Container `cynbit-postgres-db` on port 5432 with health check monitoring.
- Container `cynbit-reference-api` on port 3000 running the compiled TypeScript production build.

---

## 👨‍💻 Candidate Submission Notes

- **Applicant:** Sankalp
- **Role:** Backend Developer Intern
- **Company:** Cynbit Technologies
- **Submission Date:** October 31, 2026
- **Summary Statement:** This submission was engineered with senior production discipline. All findings are evidence-backed from passive inspection, free from speculation, and paired with an executable, fully tested TypeScript reference implementation.
