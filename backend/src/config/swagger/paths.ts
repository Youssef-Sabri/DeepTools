import { z } from 'zod';
import { registry, ApiErrorSchema } from './registry';
import {
  envelope,
  RegisterInputDocs,
  LoginInputDocs,
  ForgotPasswordInputDocs,
  ResetPasswordInputDocs,
  AuthResponseSchema,
  UserSchema,
  ProductSchema,
  CreateProductInputDocs,
  UpdateProductInputDocs,
  TemplateSchema,
  CreateTemplateInputDocs,
  UpdateTemplateInputDocs,
  LicenseSchema,
  ToggleLicenseInputDocs,
  PurchaseResponseSchema,
  UserLicenseSchema,
  TemplateDownloadResponseSchema,
} from './schemas';

const LangQueryParam = z
  .enum(['en', 'ar'])
  .optional()
  .openapi({
    param: {
      name: 'lang',
      in: 'query',
      required: false,
      description: 'Language localization code for returned content (en or ar)',
    },
    example: 'ar',
  });

// ==========================================
// 1. Auth Endpoints
// ==========================================
registry.registerPath({
  method: 'post',
  path: '/auth/register',
  tags: ['Auth'],
  summary: 'Register a new user account',
  request: {
    body: {
      content: {
        'application/json': {
          schema: RegisterInputDocs,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'User successfully registered',
      content: { 'application/json': { schema: envelope(AuthResponseSchema) } },
    },
    422: {
      description: 'Validation failed',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
    409: {
      description: 'Email already registered',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/login',
  tags: ['Auth'],
  summary: 'Log into an existing account',
  request: {
    body: {
      content: {
        'application/json': {
          schema: LoginInputDocs,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Logged in successfully, returns JWT token',
      content: { 'application/json': { schema: envelope(AuthResponseSchema) } },
    },
    401: {
      description: 'Invalid email or password',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/auth/me',
  tags: ['Auth'],
  summary: 'Get current authenticated user profile',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Profile of authenticated user',
      content: { 'application/json': { schema: envelope(UserSchema) } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/forgot-password',
  tags: ['Auth'],
  summary: 'Initiate password reset process',
  request: {
    body: {
      content: {
        'application/json': {
          schema: ForgotPasswordInputDocs,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Reset email sent message',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string().openapi({
              example: 'If this email exists, a reset link was sent.',
            }),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/reset-password',
  tags: ['Auth'],
  summary: 'Complete password reset with token',
  request: {
    body: {
      content: {
        'application/json': {
          schema: ResetPasswordInputDocs,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Password reset successful message',
      content: {
        'application/json': {
          schema: z.object({
            message: z
              .string()
              .openapi({ example: 'Password reset successful.' }),
          }),
        },
      },
    },
    400: {
      description: 'Invalid token',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/auth/me',
  tags: ['Auth'],
  summary: 'Get current authenticated user profile',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Authenticated user profile',
      content: { 'application/json': { schema: envelope(UserSchema) } },
    },
    401: {
      description: 'Not authenticated',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

// ==========================================
// 2. Product Endpoints
// ==========================================
registry.registerPath({
  method: 'get',
  path: '/products',
  tags: ['Products'],
  summary: 'Retrieve all digital products',
  request: {
    query: z.object({ lang: LangQueryParam }),
  },
  responses: {
    200: {
      description: 'List of products with localized fields',
      content: {
        'application/json': { schema: envelope(z.array(ProductSchema)) },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/products/{id}',
  tags: ['Products'],
  summary: 'Retrieve a single product by ID',
  request: {
    params: z.object({
      id: z
        .string()
        .uuid()
        .openapi({ example: '175e0e43-bd01-4f05-8b0d-85a15af96810' }),
    }),
    query: z.object({ lang: LangQueryParam }),
  },
  responses: {
    200: {
      description: 'Product found with localized fields',
      content: { 'application/json': { schema: envelope(ProductSchema) } },
    },
    404: {
      description: 'Product not found',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/products',
  tags: ['Products'],
  summary: 'Create a new product (Admin only)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateProductInputDocs,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Product created successfully',
      content: { 'application/json': { schema: envelope(ProductSchema) } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
    403: {
      description: 'Forbidden - Admin only',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
    422: {
      description: 'Validation failed',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/products/{id}',
  tags: ['Products'],
  summary: 'Update an existing product (Admin only)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: UpdateProductInputDocs,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Product updated successfully',
      content: { 'application/json': { schema: envelope(ProductSchema) } },
    },
    404: {
      description: 'Product not found',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
    422: {
      description: 'Validation failed',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/products/{id}',
  tags: ['Products'],
  summary: 'Delete a product (Admin only)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: 'Product deleted successfully',
      content: {
        'application/json': {
          schema: envelope(
            z.object({
              message: z
                .string()
                .openapi({ example: 'Product deleted successfully' }),
            }),
          ),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/products/my/licenses',
  tags: ['Products'],
  summary: 'Get licenses owned by the current authenticated user',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'List of user licenses',
      content: {
        'application/json': { schema: envelope(z.array(UserLicenseSchema)) },
      },
    },
    401: {
      description: 'Not authenticated',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/products/{id}/purchase',
  tags: ['Products'],
  summary: 'Purchase a digital product (records order snapshot and license)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: 'Purchase completed successfully',
      content: {
        'application/json': { schema: envelope(PurchaseResponseSchema) },
      },
    },
    401: {
      description: 'Not authenticated',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
    404: {
      description: 'Product not found',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
    429: {
      description: 'Rate limit exceeded',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

// ==========================================
// 3. Template Endpoints
// ==========================================
registry.registerPath({
  method: 'get',
  path: '/templates',
  tags: ['Templates'],
  summary: 'Retrieve all workflow automation templates',
  request: {
    query: z.object({ lang: LangQueryParam }),
  },
  responses: {
    200: {
      description: 'List of templates with localized fields',
      content: {
        'application/json': { schema: envelope(z.array(TemplateSchema)) },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/templates/{id}',
  tags: ['Templates'],
  summary: 'Retrieve a single template by ID',
  request: {
    params: z.object({ id: z.string().uuid() }),
    query: z.object({ lang: LangQueryParam }),
  },
  responses: {
    200: {
      description: 'Template found with localized fields',
      content: { 'application/json': { schema: envelope(TemplateSchema) } },
    },
    404: {
      description: 'Template not found',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/templates',
  tags: ['Templates'],
  summary: 'Create a new template (Admin only)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateTemplateInputDocs,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Template created successfully',
      content: { 'application/json': { schema: envelope(TemplateSchema) } },
    },
    422: {
      description: 'Validation failed',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/templates/{id}',
  tags: ['Templates'],
  summary: 'Update an existing template (Admin only)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: UpdateTemplateInputDocs,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Template updated successfully',
      content: { 'application/json': { schema: envelope(TemplateSchema) } },
    },
    422: {
      description: 'Validation failed',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/templates/{id}',
  tags: ['Templates'],
  summary: 'Delete a template (Admin only)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: 'Template deleted successfully',
      content: {
        'application/json': {
          schema: envelope(
            z.object({
              message: z
                .string()
                .openapi({ example: 'Template deleted successfully' }),
            }),
          ),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/templates/{id}/download',
  tags: ['Templates'],
  summary: 'Download a template and increment download count',
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: 'Download registered successfully',
      content: {
        'application/json': {
          schema: envelope(TemplateDownloadResponseSchema),
        },
      },
    },
    404: {
      description: 'Template not found',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

// ==========================================
// 4. Admin Endpoints
// ==========================================
registry.registerPath({
  method: 'get',
  path: '/admin/users',
  tags: ['Admin'],
  summary: 'List all registered users (Admin only)',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'List of all system users',
      content: {
        'application/json': { schema: envelope(z.array(UserSchema)) },
      },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/admin/users/{id}',
  tags: ['Admin'],
  summary: 'Delete a registered user (Admin only)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: 'User deleted successfully',
      content: {
        'application/json': {
          schema: envelope(
            z.object({
              message: z
                .string()
                .openapi({ example: 'User deleted successfully' }),
            }),
          ),
        },
      },
    },
    404: {
      description: 'User not found',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/admin/licenses',
  tags: ['Admin'],
  summary: 'List all issued licenses with relations (Admin only)',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'List of all licenses',
      content: {
        'application/json': { schema: envelope(z.array(LicenseSchema)) },
      },
    },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/admin/licenses/{id}/toggle',
  tags: ['Admin'],
  summary: 'Toggle active status of a license (Admin only)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: ToggleLicenseInputDocs,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'License status updated',
      content: { 'application/json': { schema: envelope(LicenseSchema) } },
    },
    422: {
      description: 'Validation failed',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});
