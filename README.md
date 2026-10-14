# DeepTools

DeepTools is a modern, bilingual SaaS marketplace for developers and data engineers to discover, purchase, and deploy AI agents, database utilities, and workflow automation templates.

---

## ⚡ Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS, Framer Motion
- **Backend**: Express.js, TypeScript, Prisma ORM, Zod, Helmet
- **Database**: PostgreSQL 16
- **Documentation**: Interactive OpenAPI 3.0 (Swagger UI)
- **Localization**: Full English & Arabic (RTL) support

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

- **Professional Guest Checkout & Lifetime Licenses**: Instant 1-click checkout for unregistered visitors. Orders generate permanent cryptographic license keys (`DT-XXXX-XXXX-XXXX-XXXX`) and lifetime download rights.
- **Anti-Theft Magic Link Access**: Secure, single-use email magic links allow guests to re-access their full purchase library from any device without exposing user records or passwords.
- **Universal Ownership Detection**: Marketplace catalog and product cards automatically recognize purchased assets for both guests and account holders, showing `Owned (Lifetime)` badging and instant `Download` buttons.
- **Full-Surface Card Navigation**: Cards are wrapped in high-performance Next.js links with `cursor-pointer`, enabling effortless navigation from image banners, glyphs, and descriptions with dedicated `loading.tsx` skeletons.
- **Dual-Authorization Private Downloads**: Secure streaming endpoints (`GET /api/v1/products/:id/download`) authenticating via user session cookies, guest session cookies, or single-asset download tokens.
- **Dynamic Categories Engine**: Real-time database-driven categories with localized titles, live product counts, and administrator CRUD management with conflict guards.
- **Native Bilingual Engine (English & Arabic RTL)**: Full bidirectional support (`en` and `ar`) with genuine Arabic Unicode validation, trigram search indexing, and automated locale resolution.
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

## 📜 Database Scripts

```bash
npm run db:push       # Push Prisma schema to PostgreSQL
npm run db:seed       # Seed bilingual demo catalog
npm run create:admin  # Provision administrator account
npm run db:studio     # Open Prisma Studio GUI
```

---

## 🧪 Testing & Code Quality

```bash
# Run Backend Test Suite (15 suites, 139 tests passed)
cd backend && npm test

# Run Frontend Linter (0 errors, 0 warnings)
cd frontend && npm run lint

# Build Frontend Production Bundle (21/21 static & dynamic routes)
cd frontend && npm run build
```

---

## 📄 License
MIT
