# DeepTools

DeepTools is a modern, bilingual SaaS marketplace for developers and data engineers to discover, purchase, and deploy AI agents, database utilities, and workflow automation templates.

---

## ⚡ Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS, Framer Motion
- **Backend**: Express.js, TypeScript, Prisma ORM, PostgreSQL, Zod, Helmet
- **Database**: PostgreSQL 16 (with `pg_trgm` extension for trigram search)
- **Real-Time**: Server-Sent Events (SSE) notification streaming
- **Documentation**: Interactive OpenAPI 3.0 (Swagger UI)
- **Localization**: Full English & Arabic (RTL) support with Unicode validation
- **Theme**: Pure Light Mode high-contrast design system

---

## 🚀 Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v20+ recommended)
- [Docker Desktop](https://www.docker.com/)

### 2. Environment Setup
Create a `.env` file inside `backend/` based on `backend/.env.example`:
```bash
cp backend/.env.example backend/.env
```

### 3. Run with Docker Compose
Start PostgreSQL, the Express API, and the Next.js frontend with one command:
```bash
docker compose up -d
```

### 4. Or Run Locally

```bash
# Install root dependencies
npm install

# Start PostgreSQL container
docker compose up -d postgres

# Start Backend (Port 4000)
npm run dev:backend

# Start Frontend (Port 3000)
npm run dev:frontend
```

---

## ✨ Key Platform Features

- **Mandatory Authenticated Checkout**: Purchasing digital assets strictly requires a registered user account (`Role.USER`), ensuring immutable order ownership (`user_id UUID NOT NULL`) and eliminating anonymous race conditions.
- **Real-Time Notification Engine**: Instant in-app alerts via Server-Sent Events (`GET /api/v1/notifications/stream`) and PostgreSQL review triggers (`notify_product_review()`) for product approval and rejection decisions.
- **Interactive Notification Bell**: Navbar-mounted `NotificationBell` displaying live unread badges, rich notification previews with reviewer notes, and optimistic read-state toggling.
- **Authenticated Private Downloads**: Direct binary streaming (`GET /api/v1/products/:id/download`) verified strictly against buyer license ownership or product seller authorization.
- **Dynamic Categories Engine**: Real-time database-driven categories with localized titles, live product counts, and administrator CRUD management with conflict guards.
- **Native Bilingual Engine (English & Arabic RTL)**: Full bidirectional support (`en` and `ar`) with genuine Arabic Unicode validation (`[\u0600-\u06FF]`), trigram search indexing, and automated locale resolution.
- **Pure Light Mode Aesthetics**: Curated high-contrast daylight engineering palette, clean card surfaces, and crisp borders with zero dark mode leakage.
- **Full-Surface Card Navigation**: Cards are wrapped in high-performance Next.js links with `cursor-pointer`, enabling effortless navigation from image banners, glyphs, and descriptions with dedicated `loading.tsx` skeletons.
- **Unified Creator Role**: Single account role allowing users to purchase tools and upload their own assets with admin moderation workflows.

---

## 🌐 Application URLs

| Service | URL | Description |
| :--- | :--- | :--- |
| **Web Frontend** | [http://localhost:3000](http://localhost:3000) | Next.js 16 daylight engineering UI (bilingual EN & AR) |
| **REST API** | [http://localhost:4000/api/v1](http://localhost:4000/api/v1) | Express REST API endpoints |
| **Swagger UI** | [http://localhost:4000/api/docs](http://localhost:4000/api/docs) | Interactive OpenAPI 3.0 documentation |
| **OpenAPI JSON** | [http://localhost:4000/api/docs.json](http://localhost:4000/api/docs.json) | Raw OpenAPI 3.0 specification |
| **Prisma Studio** | [http://localhost:5555](http://localhost:5555) | PostgreSQL visual database administration GUI |

---

## 📜 Database & Operational Scripts

```bash
# In backend directory:
npm run db:preflight        # Verify migrations and database schema consistency
npm run db:audit-storage    # Audit physical upload files against database records
npm run db:seed             # Seed canonical bilingual categories and catalog products
npm run db:normalize-arabic # Backfill normalized Arabic search projections
npm run create:admin        # Provision administrator account
npm run db:studio           # Open visual Prisma Studio GUI
```

---

## 🧪 Testing & Code Quality

```bash
# Run Backend Test Suite (15 suites, 138 tests passing)
cd backend && npm test

# Run Backend Linter (0 errors, 0 warnings)
cd backend && npm run lint

# Run Frontend Linter (0 errors, 0 warnings)
cd frontend && npm run lint

# Build Frontend Production Bundle
cd frontend && npm run build
```
