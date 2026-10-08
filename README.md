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

## 🌐 Application URLs

| Service | URL |
| :--- | :--- |
| **Web Frontend** | [http://localhost:3000](http://localhost:3000) |
| **REST API** | [http://localhost:4000/api/v1](http://localhost:4000/api/v1) |
| **Swagger UI** | [http://localhost:4000/api/docs](http://localhost:4000/api/docs) |
| **OpenAPI JSON** | [http://localhost:4000/api/docs.json](http://localhost:4000/api/docs.json) |

---

## 📜 Database Scripts

```bash
npm run db:push       # Push Prisma schema to PostgreSQL
npm run db:seed       # Seed bilingual demo catalog
npm run create:admin  # Provision administrator account
npm run db:studio     # Open Prisma Studio GUI
```

---

## 📄 License
MIT
