import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerDocument } from './config/swagger';
import authRoutes from './modules/auth/auth.routes';
import productsRoutes from './modules/products/products.routes';
import templatesRoutes from './modules/templates/templates.routes';
import adminRoutes from './modules/admin/admin.routes';
import { notFoundMiddleware } from './middleware/notFound.middleware';
import { errorMiddleware } from './middleware/error.middleware';

export const createApp = (): Application => {
  const app = express();

  // 1. CORS Middleware
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

  // 3. Swagger UI Documentation
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.get('/docs', (_req: Request, res: Response) => {
    res.redirect('/api/docs');
  });

  // 4. Root health check matching original NestJS AppController
  app.get('/api/v1', (_req: Request, res: Response) => {
    res.send('Hello World!');
  });

  // 5. Feature modules routes (under global prefix /api/v1)
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/products', productsRoutes);
  app.use('/api/v1/templates', templatesRoutes);
  app.use('/api/v1/admin', adminRoutes);

  // 6. 404 handler
  app.use(notFoundMiddleware);

  // 7. Global error handler
  app.use(errorMiddleware);

  return app;
};

export const app = createApp();
export default app;
