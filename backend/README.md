# DeepTools Backend API

A clean, modular, and scalable **Express.js** REST API with **TypeScript**, **Prisma ORM**, and **PostgreSQL**.

---

## 🏛️ Architecture Overview

The backend uses a feature-sliced modular architecture strictly following the separation of concerns:

```text
backend/
├── prisma/
│   └── schema.prisma        # Prisma ORM schema & relations
├── src/
│   ├── config/
│   │   ├── database.ts          # Prisma client initialization
│   │   ├── env.ts               # Environment variable loading & validation
│   │   └── swagger.ts           # OpenAPI / Swagger specs
│   ├── db/
│   │   ├── seed.ts              # Database seeding script (Prisma)
│   │   └── create-admin.ts      # Dedicated admin account provisioning
│   ├── middleware/
│   │   ├── auth.middleware.ts   # JWT authentication & role-based authorization
│   │   ├── error.middleware.ts  # Centralized global error handling
│   │   ├── validation.middleware.ts # Zod request body validation
│   │   └── notFound.middleware.ts   # 404 handler
│   ├── utils/
│   │   ├── apiError.ts          # Strongly typed HTTP error classes
│   │   └── asyncHandler.ts      # Async route handler wrapper
│   ├── modules/
│   │   ├── auth/                # Authentication module
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.repository.ts
│   │   │   └── auth.validator.ts
│   │   ├── products/            # Digital products & licensing module
│   │   │   ├── products.routes.ts
│   │   │   ├── products.controller.ts
│   │   │   ├── products.service.ts
│   │   │   ├── products.repository.ts
│   │   │   └── products.validator.ts
│   │   ├── templates/           # Automation workflow templates module
│   │   │   ├── templates.routes.ts
│   │   │   ├── templates.controller.ts
│   │   │   ├── templates.service.ts
│   │   │   ├── templates.repository.ts
│   │   │   └── templates.validator.ts
│   │   └── admin/               # Administration & i18n settings module
│   │       ├── admin.routes.ts
│   │       ├── admin.controller.ts
│   │       ├── admin.service.ts
│   │       ├── admin.repository.ts
│   │       └── admin.validator.ts
│   ├── app.ts                   # Express app configuration & middleware
│   └── server.ts                # HTTP server bootstrap & graceful shutdown
├── .env
├── .env.example
├── .gitignore
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## 🔄 Request Lifecycle Flow

```text
HTTP Request
     ↓
Express App (app.ts)
     ↓
Route (e.g., modules/products/products.routes.ts)
     ↓
Middleware (auth, validation, roles)
     ↓
Controller (e.g., products.controller.ts)
     ↓
Service (e.g., products.service.ts - pure business logic & bilingual resolution)
     ↓
Repository (e.g., products.repository.ts - Prisma queries)
     ↓
Database (PostgreSQL)
```

---

## 🚀 Scripts

- `npm run dev` or `npm run start:dev` — Start development server with `ts-node`
- `npm run build` — Compile TypeScript to `dist/`
- `npm run start` — Run production bundle (`node dist/server`)
- `npm run lint` — Lint and fix code using ESLint
- `npm run db:generate` — Generate Prisma Client
- `npm run db:push` — Push schema changes directly to PostgreSQL
- `npm run db:studio` — Open Prisma Studio browser GUI
- `npm run db:seed` — Seed demo products and templates
- `npm run create:admin` — Provision administrator credentials
