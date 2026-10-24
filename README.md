# EventOS Intelligence

> **Event Intelligence OS** — Multi-Tenant, 4-Role Hackathon, Expo & Innovation Fest Management SaaS built with Next.js 16 (Turbopack), React 19, Drizzle ORM, and Supabase PostgreSQL.

---

## 🌟 Architecture & Key Features

### 🛡️ Phase 1: Security & Foundation (Completed)
* **Secure Session Auth & HTTP-Only Cookies:**
  * Replaced client-only localStorage authentication with signed JWT session tokens using `jose`.
  * Tokens are delivered in secure, `httpOnly`, `sameSite: "lax"` cookies (`eventos_session`).
* **Server-Side Route Middleware Protection (`src/middleware.ts`):**
  * Edge/Node runtime middleware gates all protected portals:
    * `/console` → Requires `admin`
    * `/judge` → Requires `judge` or `admin`
    * `/participant` → Requires `participant` or `admin`
    * `/visitor` → Requires `visitor` or `admin`
    * `/checkin` → Requires `admin` / staff
  * Unauthenticated requests are safely redirected to `/login?redirect=...`. Role mismatches route to the appropriate dashboard.
* **Role-Based Access Control (RBAC) on Every API Route:**
  * All 24 API routes are protected using `requireAuth(req, allowedRoles)` with standard 401 Unauthorized and 403 Forbidden responses.
* **True Multi-Tenancy & Tenant Scoping:**
  * Added `organizations` table to Drizzle schema and migrated in database without data loss.
  * Added `organizationId` to `users` and `events` tables.
  * All existing records are safely associated with default tenant `EventOS Global` (`default-org`).
  * Created `supabase-rls.sql` with full PostgreSQL Row Level Security (RLS) policies.
* **Zod Input Validation & Sliding-Window Rate Limiting:**
  * All API request bodies are strongly validated with Zod schemas in `src/lib/validations/`.
  * Sliding-window token rate limiting in `src/lib/rateLimit.ts` applied to:
    * `/api/auth/login` (10 requests / 15 min)
    * `/api/auth/register` (5 requests / 15 min)
    * `/api/checkin` (60 scans / min)
    * `/api/feedback` (15 submissions / 10 min)
    * `/api/scans` (60 scans / min)
  * Returns `429 Too Many Requests` with RFC `Retry-After` header.
* **Duplicate Prevention & Tamper-Proof Cryptographic Verification:**
  * **Duplicate Votes:** Visitors can only submit one vote / review per project booth.
  * **Duplicate Check-ins:** Scanner terminal returns existing check-in time without inflating gate counts.
  * **Duplicate Scoring:** Prevents multiple scores from the same judge on the same project; updates existing score (upsert).
  * **HMAC Tamper-Proof Certificates:** Generated with HMAC-SHA256 (`CERTIFICATE_SECRET`). `/verify/[code]` verifies signature integrity and alerts on any data tampering.
* **Forensic Security Audit Logs:**
  * Dedicated `audit_logs` table tracking organizer actions, scoring adjustments, check-ins, and certificate issuances.
  * Integrated **Audit Trail** tab in the Admin Console (`/console`) with search, category filtering, and live timestamps.
* **Production-Safe Mode:**
  * In-memory demo store fallback is automatically disabled when `NODE_ENV=production`.

### 🧠 Phase 2: Autonomous AI Upgrade & Deep Telemetry (Completed)
* **Hybrid AI Engine (`src/lib/llm.ts`):**
  * Integrates **Anthropic Claude 3.5 Sonnet** (`@anthropic-ai/sdk`) for generative intelligence.
  * Seamless **Zero-Key Deterministic Fallback**: If `ANTHROPIC_API_KEY` is not provided or fails/times out, the system automatically falls back to deterministic statistical engines (Z-score 1.8σ, keyword extraction, heuristic rubric scoring), guaranteeing 100% offline availability and zero downtime.
* **Post-Event Executive Report Generator (`/api/ai/report/[eventId]`):**
  * Synthesizes attendance telemetry, jury deliberations, stall ratings, and feedback into a comprehensive C-level brief.
  * Highlights standout innovations, qualitative feedback themes, spatial crowd flow, and strategic directives for future editions.
  * Exportable as formatted Markdown (`.md`) directly from `/console`.
* **Autonomous Intelligence & Deep Telemetry Dashboard (`/console` AI Insights Tab):**
  * **Score Distribution Bell Curve:** Neural histogram bucketing scores into Exceptional (90-100), Strong (80-89), Proficient (70-79), Developing (60-69), and Needs Work (<60).
  * **Jury Calibration & Strictness Index:** Real-time variance comparison indexing each jury member's average score against the cohort consensus to detect harsh or lenient grading patterns.
  * **Statistical Bias & Outlier Detection:** Automatic Z-score flags (1.8σ threshold) isolating evaluation anomalies for peer review.
  * **Spatial Footfall & Flow Velocity:** Peak hour detection, highest-density booths, and automated crowd redistribution alerts for under-visited booths.
  * **Cryptographic & Physical Security Signals:** Real-time alerts for duplicate QR pass check-ins, rapid scan bursts (shared pass screenshots), and HMAC certificate tampering.
* **Intelligent Feedback Synthesis (`/api/ai/summary/[eventId]`):**
  * Generates qualitative sentiment breakdown, theme clustering, friction points, and actionable organizer items.
* **Interactive Visitor AI Concierge (`/visitor` & `/api/ai/chat`):**
  * Floating conversational assistant guiding expo visitors to relevant booths, tracks, and live demonstrations based on their personal interests.
  * Includes quick-prompt chips ("Recommend AI Projects", "Where is HealthTech?", "Most popular booths") and rate limiting (20 queries/min).
* **Explainable Jury-to-Project Matching (`/api/ai/match`):**
  * Matches jury members to teams based on domain expertise and provides LLM/deterministic rationale for each pairing.

### 💼 Phase 3: Business & Monetization Suite (Completed)
* **Tiered Event Ticketing & Registration Pipeline:**
  * Configurable multi-tier tickets per event (e.g., Free General Admission, Early Bird, VIP Delegate Pass, Hackathon Team Pass).
  * Real-time checkout endpoint (`/api/payments/checkout`) generating order transactions with currency, quantity, and pass issuance.
  * Payment verification webhook & API (`/api/payments/verify`) supporting Razorpay HMAC signatures with automatic fallback for simulated sandbox settlements.
  * Instant gate pass activation with dynamic QR code generation immediately upon successful checkout on `/register/[eventId]`.
* **Sponsor & Partner Lead Terminal (`/sponsor`):**
  * Dedicated partner terminal with secure tier-based passcodes (Platinum, Gold, Silver, Innovation Partner).
  * High-speed badge scanner (`/api/sponsors/leads`) enabling booth staff to scan attendee passes, retrieve profiles, assign 1-5 star prospect ratings, and append internal CRM notes.
  * One-click CSV lead export (`/api/export/csv?type=sponsor_leads`) conforming to RFC 4180 standards for instant CRM integration (HubSpot, Salesforce).
* **Enterprise Bulk CSV Import & Export Engines:**
  * **Bulk Team / Project Importer** (`/api/import/projects`): Parses multipart CSV spreadsheets, auto-generates unique booth numbers and project codes, and seeds submissions in bulk.
  * **Bulk Jury Onboarding** (`/api/import/judges`): Onboards dozens of judges in one click with auto-generated access codes, organizations, and specialization tags.
  * **Universal RFC 4180 CSV Exporter** (`/api/export/csv`): Exports full event datasets for:
    * `leaderboard` (rankings, team details, average scores, judge counts, FairScore flags)
    * `attendees` (visitor registrations, pass tiers, gate check-in status)
    * `scores` (raw jury scorecards, multi-criteria breakdown, comments)
    * `feedback` (5-star ratings, sentiment classifications, reviews)
    * `sponsors` and `sponsor_leads` (exhibitor telemetry and qualified leads)
* **Monetization Telemetry & Sales Audit Ledger (`/console` Tickets & Sales Tab):**
  * Live revenue telemetry reporting Gross GMV, average order value, tier volume breakdowns, and real-time transaction ledger.

### ⚡ Phase 4: Real-Time Telemetry & Offline / Mobile Optimization (Completed)
* **Server-Sent Events (SSE) Live Telemetry Stream (`/api/realtime/[eventId]`):**
  * High-performance reactive event stream pushing leaderboard score updates, live check-in counts, total booth scans, and evaluation volume every 4 seconds.
  * Integrated directly into the Admin Console's **Live Scoring** tab with an active pulse indicator (`SSE Active (4s Pulse)`), live connection badge, and resilient fallback to polling when disconnected.
* **Offline-Tolerant Check-in Scanner Terminal (`/checkin`):**
  * Automatic network detection (`navigator.onLine`, `online`/`offline` window events) with floating offline notification badge.
  * Client-side persistent offline queue (`localStorage`) safely buffering badge scans during network drops.
  * Automatic replay and synchronization upon network reconnection with real-time UI queue count indicators.
### 🌐 Phase 5: Experience, Scale & Public API Ecosystem (Completed)
* **Prominent Brand Identity & Big Scaled Logo:**
  * Expanded `Logo.tsx` with high-resolution responsive variants (`sm`, `md`, `lg`, `xl`) and increased navbar header height (`h-20`) for prominent visibility.
* **Transparent SaaS Packages & Pricing Section (`/#pricing`):**
  * Integrated directly on the landing page with interactive billing toggle (Per Event Pass vs Annual Unlimited).
  * Three transparent tiers:
    * **Community Starter (₹0)**: Campus hackathons, 500 attendees, gate QR, deterministic FairScore.
    * **Growth Fest Pro (₹4,999)**: Flagship fests, 2,500 attendees, paid ticketing, Claude 3.5 Sonnet briefs, SSE stream, sponsor CRM.
    * **Enterprise Scale (₹14,999)**: Custom SLA, unlimited attendees, public REST API, multilingual, 99.99% uptime.
* **Multi-Language Support (English, Hindi, Gujarati):**
  * Built `LanguageContext.tsx` with persistent state (`localStorage` and cookie `eventos_lang`).
  * Quick language switcher directly in the navbar header with full localization for navigation, hero, pricing, and scanner terminals.
* **Public REST API v1 & Interactive Swagger Documentation (`/docs`):**
  * Secure API key verification (`X-API-Key` or `Authorization: Bearer`).
  * Endpoints: `GET /api/v1/events`, `GET /api/v1/projects` (paginated), `GET /api/v1/leaderboard`, `POST /api/v1/checkin`.
  * Interactive documentation playground at `/docs` with live request executor, cURL generators, and schema inspectors.
  * API key generation and revocation at `/api/keys`.
* **Database Performance Tuning & High-Speed Indexes:**
  * Executed idempotent database migration (`scripts/migrate-phase5.js`) creating PostgreSQL indexes on `projects(event_id, code)`, `scores(event_id, project_id, judge_id)`, `visitors(event_id, code)`, `scans(event_id)`, `orders(event_id)`, and `api_keys(key_hash)`.
  * Configured Next.js Image optimization (`next.config.ts`) supporting AVIF/WebP and external CDN sources.
* **Forensic Monitoring & Telemetry:**
  * Upgraded `/api/health` to report real-time database query latency, memory consumption (heap/RSS), uptime, and service status.
  * Created `src/lib/monitoring.ts` and Next.js `src/app/global-error.tsx` for error tracking.
  * Created `/api/telemetry` reporting aggregate platform metrics (events, attendees, check-in velocity, evaluations, gross ticketing GMV).
* **Automated Unit, API & End-to-End Test Suite (`npm test`):**
  * 18/18 automated tests passing:
    * **11 Unit Tests (`tests/unit/ai.test.ts`):** `judgeMatchScore`, `fairScoreCheck` (Z-score 1.8σ bias detection), `analyzeSentiment`, `summarizeFeedback`, `recommendProjects`.
    * **6 API Security & Logic Tests (`tests/api/auth-scoring-checkin.test.ts`):** Password hashing/verification, signed JWT session verification, weighted rubric calculation, duplicate scorecard prevention, and gate check-in anti-duplicate validation.
    * **1 Comprehensive E2E Test (`tests/e2e/flow.test.ts`):** Complete lifecycle flow from team registration -> gate check-in -> jury scoring -> HMAC certificate issuance -> public cryptographic verification & tamper rejection.

---

## 🛠️ Technology Stack

* **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
* **Frontend:** React 19, Vanilla CSS & Tailwind CSS tokens, Lucide Icons
* **Database & ORM:** [Drizzle ORM](https://orm.drizzle.team/) with [Supabase PostgreSQL](https://supabase.com/)
* **Security & Tokens:** `jose` (JWT), Node Web Crypto (HMAC-SHA256)
* **AI & LLM:** Anthropic Claude 3.5 Sonnet (`@anthropic-ai/sdk`) with deterministic statistical fallback
* **Real-time Streaming:** Server-Sent Events (SSE / `ReadableStream`)
* **Validation:** [Zod](https://zod.dev/)
* **Mailing:** Nodemailer (SMTP)

---

## 🚀 Environment Configuration

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Supabase / PostgreSQL pooled connection string | `postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:5432/postgres?sslmode=require` |
| `SESSION_SECRET` | 32+ character key for signing HTTP-only session JWT cookies | `openssl rand -base64 32` |
| `CERTIFICATE_SECRET` | Secret key for HMAC-SHA256 tamper-proof credential signatures | `openssl rand -base64 32` |
| `ANTHROPIC_API_KEY` | Optional Anthropic API key for Claude 3.5 Sonnet (falls back to deterministic AI if unset) | `sk-ant-api03-...` |
| `RAZORPAY_KEY_ID` | Optional Razorpay key ID for payment processing (sandbox fallback if unset) | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Optional Razorpay key secret for signature verification | `rzp_secret_...` |
| `NODE_ENV` | Environment mode (`development` or `production`) | `development` |
| `PORT` | Optional custom port (default 3000) | `3000` |
| `SMTP_HOST` | SMTP server host for email notifications | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username / email address | `notifications@eventos.local` |
| `SMTP_PASS` | SMTP application password | `app-password` |
| `SMTP_FROM` | Sender address | `EventOS <notifications@eventos.local>` |

---
| `SMTP_USER` | SMTP username / email address | `notifications@eventos.local` |
| `SMTP_PASS` | SMTP application password | `app-password` |
| `SMTP_FROM` | Sender address | `EventOS <notifications@eventos.local>` |

---

## 🧪 Testing Guide (Phase 1 Validation)

### 1. Database & Migrations
```bash
node scripts/migrate-phase1.js
npm run typecheck
npm run build
```
* **Verify:**
  * DB migration succeeds with existing data preserved.
  * `npm run typecheck` reports 0 errors.
  * `npm run build` generates all static and dynamic routes.

### 2. Session Auth & HTTP-Only Cookie
1. Navigate to `/login`.
2. Sign in as Admin (`admin@nexathon.com` / `admin123`) or click **One-Click Evaluator Sign-In**.
3. Open browser DevTools → Application → Cookies.
4. Verify cookie `eventos_session` exists with `HttpOnly`, `SameSite=Lax`, and `Path=/`.
5. Click **Logout** in top navbar.
6. Verify `eventos_session` cookie is expired and cleared by the server.

### 3. Server-Side Route Protection (Middleware)
1. In an Incognito window (unauthenticated), try opening:
   * `http://localhost:3000/console` → Should immediately redirect to `/login?redirect=%2Fconsole`
   * `http://localhost:3000/judge` → Should redirect to `/login?redirect=%2Fjudge`
   * `http://localhost:3000/participant` → Should redirect to `/login?redirect=%2Fparticipant`
   * `http://localhost:3000/checkin` → Should redirect to `/login?redirect=%2Fcheckin`
2. Log in as a Participant.
3. Try navigating to `/console` → Middleware detects role mismatch and redirects safely away with `unauthorized=true`.

### 4. Role-Based Access on API Routes
* Run unauthenticated `curl`:
  ```bash
  curl -i -X POST http://localhost:3000/api/events -H "Content-Type: application/json" -d '{"name":"Test Event"}'
  ```
  * Response: `401 Unauthorized` (`{"error":"Authentication required..."}`)
* Attempt non-admin call to admin route:
  ```bash
  curl -i -X GET http://localhost:3000/api/audit-logs
  ```
  * Response: `401 Unauthorized`

### 5. Tamper-Proof Certificate Verification
1. Navigate to `/certificates`.
2. Issue a certificate for a participant.
3. Open the issued certificate verification link `/verify/[code]`.
4. Observe the green badge: **"Official Authenticated Credential · HMAC-SHA256 Cryptographically Verified"**.

### 6. Duplicate Prevention
* **Check-in:** Scan code once at `/checkin` → "Welcome in, [Name]!". Scan again → Displays alert "[Name] was already checked in earlier today" without duplicating check-in count.
* **Scoring:** Judge scoring the same project twice updates the existing score rubric rather than corrupting average scores.
* **Voting:** Submitting a second vote from the same email for the same project returns `409 Conflict`.

### 7. Security Audit Trail
1. Log into `/console`.
2. Switch to the **Audit Trail** tab.
3. Observe live events logged with exact timestamps, actor emails, action chips, and target IDs.
4. Filter by category (Events, Scores, Check-ins, Certificates, Auth) or search by actor email.

### 8. Phase 2: AI Insights & Executive Intelligence
1. Log in as Admin (`admin@nexathon.com` / `admin123`) and open `/console`.
2. Click on the **AI Insights** tab.
3. Inspect:
   * **Score Distribution Bell Curve**: Live histogram across 5 score tiers.
   * **Statistical Calibration Index**: Z-score variance ratings per judge.
   * **Bias Alerts**: Automatic flagging of outliers (> 1.8σ).
   * **Spatial Footfall**: Top visited vs under-visited booths.
   * **Security Signals**: Cryptographic integrity and duplicate scan monitoring.
4. Click **Generate Post-Event Executive Report**:
   * Evaluates telemetry and synthesizes executive brief.
   * Click **Download Report (.md)** to export a markdown summary.

### 9. Phase 2: Visitor Floor Guide AI Concierge
1. Open `/visitor`.
2. Click on the floating **EventOS AI Concierge** badge in the bottom-right corner.
3. Ask questions like:
   * *"Recommend projects in AI/ML"*
   * *"Where is booth 14?"*
   * *"What are the top rated exhibits right now?"*
### 10. Phase 3: Ticketing, Monetization & Sponsor CRM
1. **Tiered Pass Purchase:**
   * Open `/register/[eventId]`.
   * Select a tier: Free General Admission or VIP Delegate Pass (₹999).
   * Submit registration to trigger checkout and receive instant gate pass QR code.
2. **Sponsor Terminal & Lead Retrieval:**
   * Open `/sponsor`.
   * Log in with a partner passcode (e.g. `TECH-PLATINUM-2026`).
   * Scan attendee badges, assign 1-5 star prospect ratings, save qualifying notes.
   * Click **Export CSV** to download lead list for CRM import.
3. **Admin Monetization Telemetry:**
   * In `/console`, open **Tickets & Sales** tab to view total gross revenue, pass breakdown, and audit ledger.
   * Open **Sponsors & Leads** tab to manage sponsor booths and onboard new partners.

### 11. Phase 3: Bulk CSV Import & Universal RFC 4180 Export
1. In `/console`, open **Projects** tab.
2. Click **Bulk CSV Import** to upload sample CSV teams, or click **Export CSV** to download all project rankings.
3. Open **Judges** tab and click **Bulk Import Judges** to onboard jury members with auto-generated codes.
4. Download CSVs across Feedback, Attendees, and Scores with one click.

### 12. Phase 4: Real-Time SSE Telemetry & Offline PWA Scanner
1. **Live Scoring Stream:**
   * In `/console`, navigate to the **Live Scoring** tab.
   * Notice the green pulsing indicator: `SSE Active (4s Pulse)` and live status badge.
   * As new scores and check-ins occur, the leaderboard and telemetry update reactively without page reloads.
2. **Offline-Resilient Check-In:**
   * Open `/checkin`.
   * Disconnect network (or toggle Offline in DevTools Network tab).
   * Observe amber offline badge: "Offline Mode · Scans queued locally".
   * Scan or input badge passes — scans are stored safely in local sync queue.
   * Reconnect network — queued check-ins immediately flush and sync to the server.
3. **PWA Mobile Installation:**
   * Access `/manifest.webmanifest` or open the app on mobile/Chrome and click "Install EventOS Intelligence" to test standalone app experience.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts Next.js dev server on port 3000 |
| `npm run build` | Compiles the production build (Turbopack) |
| `npm run start` | Runs the production build locally |
| `npm run typecheck` | Validates TypeScript types across the project |
| `npm test` | Runs 18 automated unit, API, and E2E lifecycle tests |
| `node scripts/migrate-phase1.js` | Runs idempotent Phase 1 database migration (orgs, audit_logs) |
| `node scripts/migrate-phase3.js` | Runs idempotent Phase 3 database migration (orders, sponsors, tiers) |
| `node scripts/migrate-phase5.js` | Runs idempotent Phase 5 database migration (indexes, api_keys) |

---

## 📄 License
MIT License.
