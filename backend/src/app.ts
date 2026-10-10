import express, { Application } from "express";
import helmet from "helmet";
import cors, { CorsOptions } from "cors";
import { env } from "./config/env";
import { prisma } from "./config/database";
import { requestIdMiddleware } from "./middleware/requestId.middleware";
import { errorHandler } from "./middleware/errorHandler.middleware";
import { notFoundHandler } from "./middleware/notFound.middleware";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/users/users.routes";
import productsRoutes from "./modules/products/products.routes";
import adminRoutes from "./modules/admin/admin.routes";
import uploadsRoutes from "./modules/uploads/uploads.routes";
import ordersRoutes from "./modules/orders/orders.routes";

const app: Application = express();

// Set security headers to mitigate common web vulnerabilities
app.use(helmet());

// Enforce strict CORS allow-list from validated env
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server or tools without origin header in development
    if (!origin || env.CORS_ORIGIN.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Blocked by CORS policy"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
};
app.use(cors(corsOptions));

// Attach unique trace ID to every incoming request
app.use(requestIdMiddleware);

// Limit JSON payload size to prevent memory overload / Denial of Service
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// 3. Swagger OpenAPI Documentation
app.get("/api/docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      docExpansion: "list",
      tryItOutEnabled: true,
    },
    customSiteTitle: "DeepTools API Documentation",
  }),
);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/docs", (_req, res) => {
  res.redirect("/api/docs");
});

// Basic health check endpoint
app.get("/health", async (req, res, next) => {
  try {
    // Ping PostgreSQL database to ensure active connection
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      data: {
        status: "healthy",
        database: "connected",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Root health check matching original AppController
app.get("/api/v1", (_req, res) => {
  res.json({ success: true, message: "DeepTools API v1 is active" });
});

// Mount module routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/products", productsRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/uploads", uploadsRoutes);
app.use("/api/v1/orders", ordersRoutes);

// Fallback handlers for unmatched routes and centralized errors
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
