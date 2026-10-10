import { z } from 'zod';
import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
} from '@asteasolutions/zod-to-openapi';

// Extend Zod once with OpenAPI schema methods
extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// Register Bearer Auth Security Scheme
registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Enter your JWT access token obtained from /api/v1/auth/login',
});

// Common Error Schemas (Section 4)
export const ApiErrorSchema = registry.register(
  'ApiError',
  z.object({
    success: z.boolean().openapi({ example: false }),
    statusCode: z.number().openapi({ example: 400 }),
    message: z.string().openapi({ example: 'Bad Request' }),
    errors: z.array(z.any()).openapi({ example: [] }),
  }),
);
