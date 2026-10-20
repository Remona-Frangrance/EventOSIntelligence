# EventOSIntelligence

> **Event Intelligence OS** — Multi-Tenant, 4-Role Hackathon & Innovation Expo Management Platform built with Next.js 16 (Turbopack), Tailwind CSS, Drizzle ORM, and Supabase PostgreSQL.

---

## 🌟 Key Features

* **4 Dedicated Role Portals:**
  * **🛡️ Admin OS (`/console`):** Full mission control — event creation, track management, judge onboarding, certificate issuance, live score tracking, gate analytics, and AI feedback sentiment breakdown.
  * **⚖️ Jury Pad (`/judge`):** Multi-criteria evaluation rubric (Innovation, Execution, Impact, Pitch), automated anomaly detection, weighted scoring, and real-time event leaderboard sync.
  * **⚡ Participant Hub (`/participant`):** Team submission, booth digital pass & QR code generation, project media editing, image file upload, and live jury evaluation feedback view.
  * **🧭 Visitor & Expo Guide (`/visitor`):** Smart category filtering, interactive booth floor map, live search, crowd prize voting, and attendee review feed.

* **Digital Venue Check-in & Gate Pass:**
  * Common Event Gate QR (`/gate/[eventId]`) for paperless attendee admission.
  * High-speed Gate Scanner (`/checkin`) with audio feedback and verification timestamps.
  * Real-time visitor scan counts and booth traffic telemetry.

* **Award & Certificate Studio (`/certificates`):**
  * Automated SVG & high-resolution digital certificate generation with cryptographic verification codes.
  * Dynamic certificate preview and 1-click batch issuance.

* **Smart Role-Based Access Control (RBAC):**
  * Dynamic navigation bar that strictly adapts links to the authenticated user's role.
  * Protected Admin OS route guard preventing non-administrative access.
  * Crowd prize voting restricted strictly to expo visitors and attendees.

* **Media Showcase:**
  * Direct file uploads with client-side canvas compression (no S3 setup required).
  * Video pitch embedding and live demo link validation.

---

## 🛠️ Technology Stack

* **Framework:** [Next.js 16](https://nextjs.org/) (App Router & Turbopack)
* **Frontend:** React 19, Vanilla CSS & Tailwind CSS tokens, Lucide Icons
* **Database & ORM:** [Drizzle ORM](https://orm.drizzle.team/) with [Supabase PostgreSQL](https://supabase.com/)
* **QR Engine:** `qrcode` generator with SVG/Data-URL rendering

---

## 🚀 Getting Started

### 1. Prerequisites
* Node.js 18.x or later
* npm / pnpm / yarn

### 2. Clone and Install
```bash
git clone https://github.com/Remona-Frangrance/EventOSIntelligence.git
cd EventOSIntelligence
npm install
```

### 3. Environment Configuration
Copy the template and provide your database connection string:
```bash
cp .env.example .env.local
```
Edit `.env.local`:
```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@[host]:5432/postgres?sslmode=require"
```

### 4. Database Schema Push
```bash
npm run db:push
```

### 5. Run the Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Next.js dev server on port 3000 |
| `npm run build` | Compiles the production build |
| `npm run start` | Runs the production build locally |
| `npm run typecheck` | Validates TypeScript types across the project |
| `npm run db:push` | Pushes Drizzle schema directly to PostgreSQL |
| `npm run db:generate` | Generates SQL migrations |

---

## 📄 License
MIT License. Built for modern hackathons, expos, and tech symposiums.
