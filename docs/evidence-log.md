# Reconnaissance Evidence Log

**Project:** Cynbit Technologies Technical Assessment  
**Applicant:** Sankalp  
**Audit Period:** October 2026  
**Audited Target:** `https://www.cynbit.in/` and subdomains (`https://portal.cynbit.in/`)

---

## Evidence Inventory Table

| Evidence ID | Target URL | HTTP Method | Observed Status | Classification | Key Findings / Technical Metadata |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **EVD-01** | `https://www.cynbit.in/` | `HEAD` | `200 OK` | `[OBSERVED]` | Hosted on Vercel CDN (`Server: Vercel`, `X-Vercel-Cache: HIT`, edge: `bom1`). Next.js App Router detected via `Vary: rsc, next-router-state-tree`. Wildcard CORS (`Access-Control-Allow-Origin: *`) present on HTML doc. CSP, X-Frame-Options, and X-Content-Type-Options missing. |
| **EVD-02** | `https://www.cynbit.in/contact` | `HEAD` / `GET` | `200 OK` | `[OBSERVED]` | Technology banner disclosure (`X-Powered-By: Next.js`). Contact form present with fields: `fullName` (required), `email` (required), `company` (optional), `industry` (optional), `message` (required). |
| **EVD-03** | `https://www.cynbit.in/_next/static/chunks/app/(marketing)/contact/page-*.js` | `GET` | `200 OK` | `[OBSERVED]` | Form submission uses Next.js Server Action RPC (`createServerReference("40247ba4465344b3386595bab4303317cdcce907df", callServer, ...)`). Error feedback is completely generic (`r.success ? i(!0) : n("Something went wrong...")`). |
| **EVD-04** | `https://www.cynbit.in/careers` | `GET` | `200 OK` | `[OBSERVED]` | Comprehensive careers directory with 12+ active roles including "Backend Developer Intern". Links to slug-based deep routes (`/careers/[slug]`). Dynamic rendering indicators (`Cache-Control: private, no-cache, no-store`). |
| **EVD-05** | `https://www.cynbit.in/careers/backend-developer-intern` | `GET` | `200 OK` | `[OBSERVED]` | Multi-stage applicant form collecting extensive PII: Full Name, Email, Phone, WhatsApp, Date of Birth, Gender, Academic Scores, City, Permanent Residential Address, Portfolio Link, LinkedIn URL, Statement. |
| **EVD-06** | `https://www.cynbit.in/privacy` | `GET` | `200 OK` | `[OBSERVED]` | Official policy explicitly confirms backend infrastructure: **Prisma** for database management and **Resend** for transactional email dispatch. Last updated: May 20, 2026. |
| **EVD-07** | `https://www.cynbit.in/terms` | `GET` | `200 OK` | `[OBSERVED]` | Standard legal framework. Service inquiries note that form submission does not constitute a binding contract. |
| **EVD-08** | `https://www.cynbit.in/robots.txt` | `GET` | `200 OK` | `[OBSERVED]` | Explicit disallow entries for `/api/`, `/admin/`, and `/portal/`. Crawl-delay configured to 1 second. |
| **EVD-09** | `https://www.cynbit.in/api` | `HEAD` | `404 Not Found` | `[OBSERVED]` | `/api/` redirects 308 to `/api`, which returns Next.js 404 handler (`X-Next-Error-Status: 404`). Confirms absence of root API index or public REST directory. |
| **EVD-10** | `https://www.cynbit.in/portal` | `HEAD` | `307 Redirect` | `[OBSERVED]` | Redirects to dedicated subdomain `https://portal.cynbit.in/`. |
| **EVD-11** | `https://portal.cynbit.in/` | `GET` | `200 OK` | `[OBSERVED]` | Admin/Internal login portal asking for a single "Security Key" password. Meta tag indicates `robots: noindex, nofollow, nocache`. |
| **EVD-12** | `https://portal.cynbit.in/_next/static/chunks/app/portal/page-*.js` | `GET` | `200 OK` | `[OBSERVED]` | Portal login invokes Server Action `loginToPortal` (`40d93da1cc26de4ef37bcb273184b7141ef77a50f8`). On success, writes timestamp to `localStorage` (`cynbit_portal_last_activity`) and redirects to `/dashboard`. |

---

## Detailed Evidence Records

### Evidence EVD-01: Homepage Transport & Security Headers
- **Date & Time:** 2026-10-31 04:44:49 UTC+5:30
- **URL:** `https://www.cynbit.in/`
- **Method:** `HEAD` via `curl.exe -I -s -S`
- **Response Headers:**
  ```http
  HTTP/1.1 200 OK
  Accept-Ranges: bytes
  Access-Control-Allow-Origin: *
  Age: 122554
  Cache-Control: public, max-age=0, must-revalidate
  Content-Disposition: inline
  Content-Length: 100498
  Content-Type: text/html; charset=utf-8
  Date: Fri, 30 Oct 2026 23:14:46 GMT
  Etag: "babdce9795e4ef3d84461090987852d3"
  Server: Vercel
  Strict-Transport-Security: max-age=63072000
  Vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch
  X-Matched-Path: /
  X-Nextjs-Prerender: 1
  X-Nextjs-Stale-Time: 300
  X-Vercel-Cache: HIT
  X-Vercel-Id: bom1::vnbr4-1793402086752-1b0da46dacbe
  ```
- **Analysis:**
  - `[OBSERVED]` HSTS is properly configured (`max-age=63072000`).
  - `[OBSERVED]` Wildcard CORS header (`Access-Control-Allow-Origin: *`) is sent on the root HTML response. While standard for static public CDNs, it should be restricted on transactional API routes.
  - `[OBSERVED]` Missing defensive headers: `Content-Security-Policy` (CSP), `X-Frame-Options`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and `Permissions-Policy`.
  - `[OBSERVED]` Vercel Edge caching is working (`X-Vercel-Cache: HIT` from Mumbai POP `bom1`).
- **Confidence:** High.
- **Limitations:** Only external HTTP headers were observed.

---

### Evidence EVD-02 & EVD-03: Contact Form Architecture & RPC Action
- **Date & Time:** 2026-10-31 04:46:55 UTC+5:30
- **URL:** `https://www.cynbit.in/contact`
- **Bundle URL:** `https://www.cynbit.in/_next/static/chunks/app/(marketing)/contact/page-a581c8d7462124d9.js`
- **Header Observation:**
  ```http
  X-Powered-By: Next.js
  X-Matched-Path: /contact
  ```
- **Code Observation (Client Bundle):**
  ```javascript
  let x = (0, d.createServerReference)(
    "40247ba4465344b3386595bab4303317cdcce907df",
    d.callServer,
    void 0,
    d.findSourceMapURL,
    "submitInquiry"
  );

  let d = async (e) => {
    e.preventDefault();
    t(!0);
    n(null);
    let a = new FormData(e.currentTarget);
    let r = await x(a);
    t(!1);
    r.success
      ? i(!0)
      : n("Something went wrong. Please try again or email us directly.");
  };
  ```
- **Analysis:**
  - `[OBSERVED]` Technology fingerprinting: `X-Powered-By: Next.js` header disclosed.
  - `[OBSERVED]` The submission mechanism is a Next.js Server Action (`submitInquiry`) invoked via React Server Components `callServer` RPC.
  - `[OBSERVED]` Input fields serialized: `fullName`, `email`, `company`, `industry`, `message`.
  - `[OBSERVED]` Error feedback is coarse and non-actionable: `Something went wrong. Please try again or email us directly.` There is no structured field-level error mapping returned to the DOM.
  - `[INFERRED]` Server Actions run within Vercel serverless function instances, meaning execution instances are ephemeral and in-memory rate limiting is absent unless backed by a distributed Redis/KV store.
- **Confidence:** High.
- **Limitations:** Passive inspection of client bundle; no test inquiries were submitted to live production endpoints.

---

### Evidence EVD-05: Careers Section & Sensitive PII Ingestion
- **Date & Time:** 2026-10-31 04:48:15 UTC+5:30
- **URL:** `https://www.cynbit.in/careers/backend-developer-intern`
- **Observed Form Fields:**
  - Mandatory (*): `fullName`, `email`, `phone`, `whatsapp`, `dob`, `gender`, `highestQualification`, `degree`, `specialization`, `college`, `gradYear`, `educationStatus`, `scoreSystem`, `scoreValue`, `noticePeriod`, `skills`, `currentCity`, `permanentAddress`, `portfolioUrl`, `linkedinUrl`, `message`, `agreedToTerms`.
  - Optional: `professionalProfileUrl`.
- **Analysis:**
  - `[OBSERVED]` High-volume sensitive personal data ingested through a single web form, including permanent home addresses, WhatsApp numbers, and dates of birth.
  - `[RECOMMENDED]` The backend handling this data must enforce strict schema validation, input normalization, parameterization (to prevent injection), encryption at rest for sensitive fields, role-based access control, strict PII redaction in logs, and automated retention/deletion workflows.
- **Confidence:** High.

---

### Evidence EVD-06: Database & Transactional Infrastructure Stated in Privacy Policy
- **Date & Time:** 2026-10-31 04:48:39 UTC+5:30
- **URL:** `https://www.cynbit.in/privacy`
- **Observed Text (Section 4):**
  > "We use trusted partners like Resend for email delivery and Prisma for database management."
- **Analysis:**
  - `[OBSERVED]` Factual confirmation that Cynbit utilizes **Prisma** as their database ORM/data access layer and **Resend** as their transactional email dispatch service.
  - `[RECOMMENDED]` When integrating Prisma and Resend in a public inquiry workflow, database insertion should occur within an ACID-compliant transaction, and email dispatch should be handled asynchronously outside the critical request-response path to prevent latency spikes and failure cascades.
- **Confidence:** High.

---

### Evidence EVD-08 to EVD-12: Portal Architecture & Authentication Mechanisms
- **Date & Time:** 2026-10-31 04:50:55 UTC+5:30
- **URL:** `https://portal.cynbit.in/`
- **Bundle URL:** `https://portal.cynbit.in/_next/static/chunks/app/portal/page-ba479285e84c64b5.js`
- **Observed Code:**
  ```javascript
  let l = (0, s.createServerReference)(
    "40d93da1cc26de4ef37bcb273184b7141ef77a50f8",
    s.callServer,
    void 0,
    s.findSourceMapURL,
    "loginToPortal"
  );

  async function c(r) {
    r.preventDefault();
    o(!0);
    s("");
    let t = new FormData();
    t.append("password", e);
    let a = await l(t);
    if (a.success) {
      try {
        localStorage.setItem("cynbit_portal_last_activity", Date.now().toString());
      } catch (e) {}
      window.location.href = "/dashboard";
    } else {
      s(a.error || "Login failed");
      o(!1);
    }
  }
  ```
- **Analysis:**
  - `[OBSERVED]` The Cynbit internal administrative portal relies on a single "Security Key" password input.
  - `[OBSERVED]` Activity tracking stores a timestamp in `localStorage.setItem("cynbit_portal_last_activity", ...)`.
  - `[RECOMMENDED]` A shared security key lacks multi-tenant identity, per-user audit trails, and granular RBAC. Administrative endpoints should mandate individual user authentication (e.g., Argon2id/Bcrypt hashed credentials), session tokens stored in `HttpOnly`, `Secure`, `SameSite=Strict` cookies, and rate limiting against brute-force attacks.
- **Confidence:** High.
- **Limitations:** No authentication attempts were made; observed purely through public static client bundle analysis.
