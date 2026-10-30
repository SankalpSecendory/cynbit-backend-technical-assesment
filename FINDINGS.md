# Prioritized Technical Findings & Recommendations

**Company:** Cynbit Technologies  
**Assessment:** Backend Developer Intern Technical Assessment  
**Applicant:** Sankalp  
**Scope:** Public website technical audit (`https://www.cynbit.in/` and `https://portal.cynbit.in/`)

---

## Executive Summary of Findings

| ID | Finding Title | Category | Severity | Likelihood | Confidence | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Missing Defense-in-Depth HTTP Security Headers & Framework Disclosure | Security | **Medium** | High | High | `[OBSERVED]` |
| **SEC-02** | Absence of Verifiable Rate Limiting on Public Form Submissions | Security | **High** | High | Medium | `[INFERRED]` |
| **API-01** | UI-Coupled RPC Server Action vs Standardized REST API Contract | API Design | **Medium** | Medium | High | `[OBSERVED]` |
| **VAL-01** | Coarse Error Handling & Necessity of Server-Side Schema Validation | Data Validation | **Medium** | High | High | `[OBSERVED]` |
| **DATA-01** | High-Volume Sensitive PII Ingestion Without Clear Retention Controls | Database Integrity | **High** | Medium | High | `[OBSERVED]` |
| **AUTH-01** | Shared Security Key in Admin Portal vs Multi-Tenant RBAC & Secure Sessions | Authentication | **High** | Medium | High | `[OBSERVED]` |
| **PERF-01** | Risk of Synchronous Email Dispatch Blocking HTTP Request Response Cycle | Performance | **Medium** | High | High | `[OBSERVED]` |
| **REL-01** | Lack of Standardized Error Contract & End-to-End Request ID Correlation | Reliability | **Medium** | Medium | High | `[OBSERVED]` |

---

## Detailed Finding Reports

### Finding SEC-01: Missing Defense-in-Depth HTTP Security Headers & Framework Disclosure
- **Finding ID:** `SEC-01`
- **Category:** Security
- **Observation Classification:** `[OBSERVED]`
- **Severity:** Medium
- **Likelihood:** High
- **Confidence:** High
- **Description:**  
  Passive inspection of HTTP response headers on `https://www.cynbit.in/` and `https://www.cynbit.in/contact` demonstrates the presence of HSTS (`Strict-Transport-Security: max-age=63072000`), but several standard defensive headers are missing:
  1. `Content-Security-Policy` (CSP) is absent.
  2. `X-Frame-Options` is absent, increasing clickjacking susceptibility.
  3. `X-Content-Type-Options: nosniff` is absent, allowing MIME-sniffing vulnerabilities in legacy browsers.
  4. `Referrer-Policy` and `Permissions-Policy` are absent.
  5. The `X-Powered-By: Next.js` header is explicitly exposed on `/contact` and `/careers`, broadcasting the underlying framework to scanners.
- **Evidence:**  
  Recorded in `docs/evidence-log.md` (EVD-01, EVD-02):
  ```http
  X-Powered-By: Next.js
  Strict-Transport-Security: max-age=63072000
  Access-Control-Allow-Origin: *
  ```
- **Potential Impact:**  
  Fingerprinting simplifies targeted framework exploits. Lack of CSP and frame restrictions exposes users to clickjacking and script injection in secondary views.
- **Recommended Fix:**  
  Mount `helmet` middleware in Express to automatically inject hardened headers (`nosniff`, `frameguard`, `hidePoweredBy`, `contentSecurityPolicy`, `referrerPolicy`).
- **Implementation Reference:**  
  [app.ts](file:///C:/Users/ishit/.gemini/antigravity/scratch/cynbit-backend-technical-audit/reference-api/src/app.ts#L18-L25)
- **Verification Method:**  
  `curl.exe -I http://localhost:3000/api/v1/health` verifies that `X-Powered-By` is stripped and security headers (`X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`) are returned.

---

### Finding SEC-02: Absence of Verifiable Rate Limiting on Public Form Submissions
- **Finding ID:** `SEC-02`
- **Category:** Security / Reliability
- **Observation Classification:** `[INFERRED]`
- **Severity:** High
- **Likelihood:** High
- **Confidence:** Medium
- **Description:**  
  The contact form and multi-step career application submit data directly to Next.js Server Actions on Vercel. In default serverless configurations, instances spin up on demand and do not maintain shared in-memory state. Unless explicitly configured with Upstash Redis or edge middleware, serverless endpoints are vulnerable to automated bot submission loops and database resource starvation.
- **Evidence:**  
  Observed Server Action `submitInquiry` in client chunk (`40247ba4465344b3386595bab4303317cdcce907df`). No client-side throttling, CAPTCHA, or challenge is present.
- **Potential Impact:**  
  Spam flood can exhaust transactional email quotas (Resend limit exhaustion), flood the database with bogus records, inflate serverless execution bills, and degrade site responsiveness.
- **Recommended Fix:**  
  Implement two-tier rate limiting: IP-based sliding window rate limiter at the API gateway layer (`express-rate-limit` with Redis store in production, in-memory for standalone) restricting inquiry submissions to 5 requests per 15-minute window per IP.
- **Implementation Reference:**  
  [rate-limiter.ts](file:///C:/Users/ishit/.gemini/antigravity/scratch/cynbit-backend-technical-audit/reference-api/src/middleware/rate-limiter.ts)
- **Verification Method:**  
  Automated integration test `rate-limit.test.ts` executes rapid bursts of inquiry requests and verifies HTTP `429 Too Many Requests` status code with `Retry-After` headers.

---

### Finding API-01: UI-Coupled RPC Server Action vs Standardized REST API Contract
- **Finding ID:** `API-01`
- **Category:** API Design
- **Observation Classification:** `[OBSERVED]`
- **Severity:** Medium
- **Likelihood:** Medium
- **Confidence:** High
- **Description:**  
  The website currently handles contact inquiries via Next.js Server Action RPC (`callServer` with cryptic hash IDs). While convenient for tightly coupled React applications, it lacks a standardized public REST API contract (`POST /api/v1/inquiries`), preventing integration with external CRM systems, partner pipelines, mobile apps, or automated workflow agents.
- **Evidence:**  
  Static bundle inspection shows direct RPC invocation:
  ```javascript
  let x = (0, d.createServerReference)("40247ba4465344b3386595bab4303317cdcce907df", d.callServer, ...);
  ```
- **Potential Impact:**  
  Tight coupling hinders architectural scalability, prevents API reusability, complicates third-party integrations, and circumvents standard REST observability patterns (standardized HTTP status codes, structured JSON error bodies, and OpenAPI specs).
- **Recommended Fix:**  
  Design and expose a dedicated, versioned REST endpoint: `POST /api/v1/inquiries` accepting JSON payloads, validated via schema middleware, returning HTTP `201 Created` with a resource ID, or HTTP `400 Bad Request` with structured field errors.
- **Implementation Reference:**  
  [inquiry.routes.ts](file:///C:/Users/ishit/.gemini/antigravity/scratch/cynbit-backend-technical-audit/reference-api/src/routes/inquiry.routes.ts), [inquiry.controller.ts](file:///C:/Users/ishit/.gemini/antigravity/scratch/cynbit-backend-technical-audit/reference-api/src/controllers/inquiry.controller.ts)
- **Verification Method:**  
  Execute HTTP POST request with valid JSON payload; verify HTTP 201 response with `{ success: true, data: { inquiryId, status: "received" } }`.

---

### Finding VAL-01: Coarse Error Handling & Necessity of Server-Side Schema Validation
- **Finding ID:** `VAL-01`
- **Category:** Data Validation
- **Observation Classification:** `[OBSERVED]`
- **Severity:** Medium
- **Likelihood:** High
- **Confidence:** High
- **Description:**  
  Inspection of the contact submission handler reveals that any failure returns a coarse generic string:
  `r.success ? i(!0) : n("Something went wrong. Please try again or email us directly.")`.
  There is no structured field-level error mapping returned to the user or validated against strict length/type boundaries. Relying solely on client HTML5 attributes (`required`, `type="email"`) is insufficient, as raw HTTP clients can bypass frontend constraints to submit oversized strings or unexpected properties.
- **Evidence:**  
  Observed in `contact-page.js` (EVD-03).
- **Potential Impact:**  
  Users are unable to diagnose submission issues (e.g., malformed email or excessive payload). Backends without strict schema enforcement are susceptible to prototype pollution, mass-assignment vulnerabilities, and buffer exhaustion.
- **Recommended Fix:**  
  Implement server-side schema validation using Zod in strict mode (`.strict()`). Validate maximum string lengths, email regex compliance, trim whitespace, reject unexpected fields, and return structured field-level error arrays on HTTP 400.
- **Implementation Reference:**  
  [inquiry.schema.ts](file:///C:/Users/ishit/.gemini/antigravity/scratch/cynbit-backend-technical-audit/reference-api/src/schemas/inquiry.schema.ts), [validate.ts](file:///C:/Users/ishit/.gemini/antigravity/scratch/cynbit-backend-technical-audit/reference-api/src/middleware/validate.ts)
- **Verification Method:**  
  Automated tests in `inquiry.validation.test.ts` submit missing fields, oversized messages, invalid emails, and extra attributes, verifying HTTP 400 with detailed `VALIDATION_ERROR` payloads.

---

### Finding DATA-01: High-Volume Sensitive PII Ingestion Without Clear Retention Controls
- **Finding ID:** `DATA-01`
- **Category:** Database Integrity & Privacy
- **Observation Classification:** `[OBSERVED]`
- **Severity:** High
- **Likelihood:** Medium
- **Confidence:** High
- **Description:**  
  The careers application form at `/careers/backend-developer-intern` collects extensive sensitive personally identifiable information (PII): full residential address, date of birth, phone, WhatsApp number, college transcripts, and professional URLs. If logged in plain text or retained indefinitely in primary database tables without lifecycle policies, it creates compliance risks under data protection frameworks (such as the Digital Personal Data Protection Act, DPDP 2023).
- **Evidence:**  
  Observed form fields in `EVD-05`.
- **Potential Impact:**  
  Log files containing full PII expose applicant data to monitoring tools and developers. Unchecked data retention expands breach exposure.
- **Recommended Fix:**  
  1. Never log raw inquiry or application message content or phone numbers; sanitize structured log output using Pino serializers and redaction paths (`email`, `phone`, `permanentAddress`, `message`).
  2. Implement database-level timestamp tracking (`createdAt`, `updatedAt`) and an automated retention query or archiving job.
  3. Ensure database columns enforce strict length constraints and indexes on non-PII queryable fields (`status`, `createdAt`).
- **Implementation Reference:**  
  [logger.ts](file:///C:/Users/ishit/.gemini/antigravity/scratch/cynbit-backend-technical-audit/reference-api/src/utils/logger.ts), [schema.prisma](file:///C:/Users/ishit/.gemini/antigravity/scratch/cynbit-backend-technical-audit/reference-api/prisma/schema.prisma)
- **Verification Method:**  
  Verify logger configuration masks PII fields; verify Prisma schema sets length constraints and excludes raw message fields from log outputs.

---

### Finding AUTH-01: Shared Security Key in Admin Portal vs Multi-Tenant RBAC & Secure Sessions
- **Finding ID:** `AUTH-01`
- **Category:** Authentication & Authorization
- **Observation Classification:** `[OBSERVED]`
- **Severity:** High
- **Likelihood:** Medium
- **Confidence:** High
- **Description:**  
  Inspection of `https://portal.cynbit.in/` reveals an internal portal login protected by a single input: "Security Key" (`<input type="password" placeholder="••••••••" ... />`). On success, the client bundle executes:
  `localStorage.setItem("cynbit_portal_last_activity", Date.now().toString()); window.location.href = "/dashboard";`
  A single shared key lacks user identity, non-repudiation, granular role-based access control (RBAC), and multi-factor authentication (MFA). Furthermore, storing session activity in `localStorage` rather than HTTP-only secure cookies makes it susceptible to script-based exfiltration.
- **Evidence:**  
  Directly inspected bundle `portal-page.js` (EVD-11, EVD-12).
- **Potential Impact:**  
  If a shared key is compromised, all administrative systems are breached. Individual actions cannot be audited to specific team members. Revocation requires disrupting all users.
- **Recommended Fix:**  
  Transition administrative routes to individual credential authentication with Argon2id hashing, secure JWT or session cookies marked `HttpOnly`, `Secure`, and `SameSite=Strict`, role-based permissions (`admin`, `staff`, `viewer`), and rate limiting on the login route.
- **Implementation Reference:**  
  [auth.ts](file:///C:/Users/ishit/.gemini/antigravity/scratch/cynbit-backend-technical-audit/reference-api/src/middleware/auth.ts), protected route in [inquiry.routes.ts](file:///C:/Users/ishit/.gemini/antigravity/scratch/cynbit-backend-technical-audit/reference-api/src/routes/inquiry.routes.ts)
- **Verification Method:**  
  Verify unauthenticated requests to `GET /api/v1/inquiries` return `401 Unauthorized`; verify authorized requests with `Authorization: Bearer <token>` succeed with pagination.

---

### Finding PERF-01: Risk of Synchronous Email Dispatch Blocking Request-Response Cycle
- **Finding ID:** `PERF-01`
- **Category:** Performance & Reliability
- **Observation Classification:** `[OBSERVED]`
- **Severity:** Medium
- **Likelihood:** High
- **Confidence:** High
- **Description:**  
  Cynbit's Privacy Policy acknowledges the use of **Resend** for transactional email delivery alongside **Prisma** for data persistence. In standard serverless architectures, if the application attempts to deliver the Resend API email synchronously before responding to the user's form submission, any third-party SMTP/API latency (300ms–2000ms) or network timeout blocks the HTTP response or causes the entire transaction to fail.
- **Evidence:**  
  Privacy policy section 4 ("Third-Party Services: Resend and Prisma").
- **Potential Impact:**  
  Elevated p95/p99 latency for visitors. If Resend experiences a momentary outage, user form submissions could throw an unhandled error even if database persistence succeeded.
- **Recommended Fix:**  
  Decouple persistence from notification dispatch. Durably commit the inquiry to PostgreSQL first, respond to the client immediately with HTTP 201 (`inquiryId`), and trigger email notifications asynchronously via a background task queue (or decoupled async promise with exponential retry and dead-letter handling).
- **Implementation Reference:**  
  [inquiry.service.ts](file:///C:/Users/ishit/.gemini/antigravity/scratch/cynbit-backend-technical-audit/reference-api/src/services/inquiry.service.ts)
- **Verification Method:**  
  Integration test verifies HTTP 201 response latency is minimal and persistence succeeds even when email dispatcher mocks simulate network delay or failure.

---

### Finding REL-01: Lack of Standardized Error Contract & End-to-End Request ID Correlation
- **Finding ID:** `REL-01`
- **Category:** Reliability & Observability
- **Observation Classification:** `[OBSERVED]`
- **Severity:** Medium
- **Likelihood:** Medium
- **Confidence:** High
- **Description:**  
  Neither the public website nor the portal provides structured error contracts or unique request correlation identifiers (`X-Request-ID`). When an error occurs during inquiry or portal operations, debugging production failures across distributed services requires searching through time-correlated logs without an unambiguous trace token.
- **Evidence:**  
  Observed in client bundle error strings and HTTP header responses.
- **Potential Impact:**  
  High Mean Time To Resolution (MTTR) during outages; difficulty correlating client-side incidents with backend server traces; potential accidental disclosure of internal stack traces if unhandled exceptions bubble up.
- **Recommended Fix:**  
  Introduce `request-id` middleware generating UUID v4 / nanoid for every incoming HTTP request, attaching it to response headers (`X-Request-Id`) and Pino structured log contexts. Standardize all API error responses around an RFC 7807-inspired schema `{ success: false, error: { code, message, details?, requestId } }`.
- **Implementation Reference:**  
  [request-id.ts](file:///C:/Users/ishit/.gemini/antigravity/scratch/cynbit-backend-technical-audit/reference-api/src/middleware/request-id.ts), [error-handler.ts](file:///C:/Users/ishit/.gemini/antigravity/scratch/cynbit-backend-technical-audit/reference-api/src/middleware/error-handler.ts)
- **Verification Method:**  
  Automated tests verify that every request returns an `X-Request-Id` header and that 400/404/500 errors strictly conform to the unified error contract.
