import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import cors, { CorsOptions } from "cors";
import { env } from "./config/env";
import { prisma } from "./config/database";
import { requestIdMiddleware } from "./middleware/requestId.middleware";
import { errorHandler } from "./middleware/errorHandler.middleware";
import { notFoundHandler } from "./middleware/notFound.middleware";
import swaggerUi from "swagger-ui-express";
import { swaggerDocument } from "./config/swagger/index";
import { generalRateLimiter } from "./middleware/rateLimit.middleware";
import { localeMiddleware } from "./middleware/locale.middleware";

import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/users/users.routes";
import productsRoutes from "./modules/products/products.routes";
import adminRoutes from "./modules/admin/admin.routes";
import uploadsRoutes from "./modules/uploads/uploads.routes";
import ordersRoutes from "./modules/orders/orders.routes";
import paymentsRoutes from "./modules/payments/payments.routes";
import publicSettingsRoutes from "./modules/settings/public-settings.routes";
import categoriesRoutes from "./modules/categories/categories.routes";
import notificationsRoutes from "./modules/notifications/notifications.routes";

export const createApp = (): Application => {
  const app: Application = express();

  // Keep the application-wide policy free of inline scripts and styles.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'", "data:"],
        },
      },
    }),
  );

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
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Request-Id",
      "X-CSRF-Token",
      "Accept-Language",
      "X-Locale",
      "X-Language",
      "Content-Language",
    ],
  };
  app.use(cors(corsOptions));

  // Attach unique trace ID to every incoming request
  app.use(requestIdMiddleware);

  // Initialize request language detection and bilingual response context
  app.use(localeMiddleware);

  app.set("trust proxy", env.TRUST_PROXY_HOPS);
  app.use("/api/v1", (req, res, next) =>
    req.path.startsWith("/payments/webhooks/")
      ? next()
      : generalRateLimiter(req, res, next),
  );
  // Webhook signatures must be checked against the unparsed request bytes.
  app.use("/api/v1/payments", paymentsRoutes);

  // Limit JSON payload size to prevent memory overload / Denial of Service
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // 3. Swagger OpenAPI Documentation
  const swaggerMiddleware = swaggerUi.setup(swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      docExpansion: "list",
      tryItOutEnabled: true,
    },
    customSiteTitle: "DeepTools API Documentation",
  });

  // swagger-ui-express emits an inline initialization script and inline styles.
  // Limit that compatibility exception to the documentation pages and assets.
  app.use(
    ["/api/docs", "/api/v1/docs", "/api-docs"],
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "validator.swagger.io"],
        },
      },
    }),
  );

  app.get(
    ["/api/docs.json", "/api/v1/docs.json"],
    (_req: Request, res: Response) => {
      res.setHeader("Content-Type", "application/json");
      res.send(swaggerDocument);
    },
  );
  app.use("/api/docs", swaggerUi.serve, swaggerMiddleware);
  app.use("/api/v1/docs", swaggerUi.serve, swaggerMiddleware);
  app.use("/api-docs", swaggerUi.serve, swaggerMiddleware);

  app.get(["/docs", "/v1/docs"], (_req: Request, res: Response) => {
    res.redirect("/api/docs");
  });

  // Basic health check endpoint
  app.get("/health", async (_req: Request, res: Response, next) => {
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
  app.get("/api/v1", (_req: Request, res: Response) => {
    res.json({ success: true, message: "DeepTools API v1 is active" });
  });

  // Mount module routes
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/users", userRoutes);
  app.use("/api/v1/products", productsRoutes);
  app.use("/api/v1/categories", categoriesRoutes);
  app.use("/api/v1/settings", publicSettingsRoutes);
  app.use("/api/v1/admin", adminRoutes);
  app.use("/api/v1/uploads", uploadsRoutes);
  app.use("/api/v1/orders", ordersRoutes);
  app.use("/api/v1/notifications", notificationsRoutes);

  // Fallback handlers for unmatched routes and centralized errors
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export const app: Application = createApp();
export default app;
