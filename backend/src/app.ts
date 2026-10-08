import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerDocument } from './config/swagger/index';
import authRoutes from './modules/auth/auth.routes';
import productsRoutes from './modules/products/products.routes';
import templatesRoutes from './modules/templates/templates.routes';
import adminRoutes from './modules/admin/admin.routes';
import uploadsRoutes from './modules/uploads/uploads.routes';
import { requestIdMiddleware } from './middleware/requestId.middleware';
import { notFoundMiddleware } from './middleware/notFound.middleware';
import { errorMiddleware } from './middleware/error.middleware';

export const createApp = (): Application => {
  const app = express();

  // 1. Request ID Tagging (Section 9)
  app.use(requestIdMiddleware);

  // 2. Security Headers (Rule 5.6)
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Swagger UI and external assets
      crossOriginEmbedderPolicy: false,
    }),
  );

  // 2. CORS Middleware (Strict allow-list)
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // 2. Request body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 3. Swagger OpenAPI Documentation
  app.get('/api/docs.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        docExpansion: 'list',
        tryItOutEnabled: true,
      },
      customSiteTitle: 'DeepTools API Documentation',
    }),
  );
  app.get('/docs', (_req: Request, res: Response) => {
    res.redirect('/api/docs');
  });

  // 4. Root health check matching original AppController
  app.get('/api/v1', (_req: Request, res: Response) => {
    res.json({ success: true, message: 'DeepTools API v1 is active' });
  });

  // 5. Feature modules routes (under global prefix /api/v1)
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/products', productsRoutes);
  app.use('/api/v1/templates', templatesRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/uploads', uploadsRoutes);

  // 6. 404 handler
  app.use(notFoundMiddleware);

  // 7. Global error handler
  app.use(errorMiddleware);

  return app;
};

export const app = createApp();
export default app;
