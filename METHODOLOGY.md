# Passive Reconnaissance & Technical Audit Methodology

**Assessment Context:** Cynbit Technologies Technical Assessment  
**Applicant:** Sankalp  
**Role:** Backend Developer Intern  
**Target:** https://www.cynbit.in/  
**Scope:** Publicly observable technical behavior, HTTP communications, client-side bundles, API design, security headers, and data handling workflows.

---

## 1. Ethical & Authorized Testing Boundaries

This technical audit strictly adheres to the principle of passive, non-intrusive observation. No destructive actions, automated vulnerability scanning, or unauthorized exploitation attempts were conducted.

### 1.1 Permitted Activities Conducted
- **Public Surface Browsing:** Navigating all publicly exposed routes (`/`, `/story`, `/team`, `/services`, `/products`, `/case-studies`, `/careers`, `/contact`, `/privacy`, `/terms`, `/portal`).
- **HTTP/HTTPS Header Inspection:** Observing network response codes, cache directives (`Cache-Control`, `X-Vercel-Cache`, `Age`), transport security (`Strict-Transport-Security`), CORS configuration (`Access-Control-Allow-Origin`), and server identification headers (`Server`, `X-Powered-By`).
- **Client Bundle Analysis:** Inspecting publicly served JavaScript bundles (`/_next/static/chunks/...`) to understand client-side state management, form event handlers, validation triggers, and RPC/Server Action references.
- **Resource Discovery:** Inspecting standard discovery documents including `/robots.txt` and `/sitemap.xml`.
- **Network Performance Baseline:** Low-volume latency and timing checks using standard HTTP client calls to measure DNS resolution, TLS handshake, time to first byte (TTFB), and content download times.
- **Reference Implementation:** Building an independent, standalone demonstration backend running locally in an isolated test environment.

### 1.2 Explicitly Prohibited & Excluded Activities
- No automated vulnerability scanning (e.g., OWASP ZAP, Nikto, Nessus, Nuclei, Burp Suite Active Scanner).
- No denial of service (DoS), distributed denial of service (DDoS), or stress/load testing.
- No credential stuffing, dictionary attacks, or brute-force attempts against authentication endpoints (including the Cynbit Portal security key input).
- No injection testing (SQLi, NoSQLi, Command Injection, XSS, SSRF, or XML External Entity injection).
- No tampering with or interception of production database records.
- No automated mass scraping of personal data from applicant profiles or case studies.
- No attempting to bypass rate limiters, web application firewalls (WAF), or CAPTCHAs.

---

## 2. Evidence Classification Framework

To maintain technical integrity and avoid speculative claims, every statement in this audit is strictly categorized under one of three tiers:

| Classification | Definition | Application in Report |
| :--- | :--- | :--- |
| **`[OBSERVED]`** | Directly verified through public HTTP responses, public HTML source, or public JavaScript bundles. | Factual headers, HTTP status codes, form input fields, server technologies, bundle RPC IDs. |
| **`[INFERRED]`** | A technically reasoned architectural conclusion based on standard framework patterns, without direct internal server access. | Serverless function execution lifecycle, cold start behaviors, state synchronization mechanisms. |
| **`[RECOMMENDED]`** | An industry-standard defensive control, architectural pattern, or code improvement proposed to eliminate risks. | Express API structure, Zod validation schemas, Prisma transactional integrity, rate limiting, RBAC. |

---

## 3. Tooling & Observation Protocol

The assessment utilized standard production-grade inspection tools:
1. **Network Header Inspector (`curl.exe`):**
   - Protocol inspection: HTTP/1.1 and HTTP/2 over TLS 1.3.
   - Header extraction flags: `-I -s -S`.
   - Timing measurements: `-w "%{time_namelookup}, %{time_connect}, %{time_appconnect}, %{time_starttransfer}, %{time_total}"`.
2. **HTML & Metadata Parser:**
   - Inspection of DOM trees, JSON-LD structured data schemas (`ProfessionalService`, `ContactPage`), and `<meta>` security tags.
3. **Static JavaScript Reverse-Analysis:**
   - Webpack chunk inspection of Next.js App Router client components (`page-*.js`) using isolated Node.js inspection scripts to identify `createServerReference`, `callServer`, and `FormData` serialization.
4. **Local Verification Pipeline:**
   - Local Node.js v24 runtime with TypeScript strict mode, Express.js, Prisma ORM, Vitest, and Supertest for building and validating the reference backend.

---

## 4. Confidence & Severity Scoring Matrix

Findings are prioritized using standard CVSS-aligned severity and confidence scoring:

### 4.1 Severity Levels
- **Critical:** Immediate severe compromise of data integrity, confidentiality, or system availability.
- **High:** Substantial security weakness or major reliability flaw capable of impacting business operations.
- **Medium:** Defense-in-depth deficiency, missing architectural validation, or rate limit vulnerability requiring remediation.
- **Low:** Minor configuration deviation, informational disclosure, or optimization opportunity.
- **Informational:** Architectural observation or recommendation aligned with production best practices.

### 4.2 Confidence Levels
- **High:** Directly verified via deterministic HTTP response or static bundle source code.
- **Medium:** Consistent behavioral pattern confirmed across multiple independent passive requests.
- **Low:** Inferred from platform defaults; requires internal or authenticated testing for absolute verification.
