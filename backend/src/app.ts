import express, { Application } from 'express';
import helmet from 'helmet';
import cors, { CorsOptions } from 'cors';
import { env } from './config/env';
import { prisma } from './config/database';
import { requestIdMiddleware } from './middleware/requestId.middleware';
import { errorHandler } from './middleware/errorHandler.middleware';
import { notFoundHandler } from './middleware/notFound.middleware';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import adminRoutes from './modules/admin/admin.routes';

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
      callback(new Error('Blocked by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
};
app.use(cors(corsOptions));

// Attach unique trace ID to every incoming request
app.use(requestIdMiddleware);

// Limit JSON payload size to prevent memory overload / Denial of Service
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Basic health check endpoint
app.get('/health', async (req, res, next) => {
  try {
    // Ping PostgreSQL database to ensure active connection
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Mount module routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// Fallback handlers for unmatched routes and centralized errors
app.use(notFoundHandler);
app.use(errorHandler);

export default app;