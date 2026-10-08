export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'DeepTools API Documentation',
    version: '1.0.0',
    description:
      'Bilingual AI & Database SaaS Platform REST API (Express.js + TypeScript)',
  },
  servers: [
    {
      url: 'http://localhost:4000/api/v1',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token obtained from /auth/login',
      },
    },
  },
  tags: [
    { name: 'Auth', description: 'Authentication and profile management' },
    { name: 'Products', description: 'AI agents and database utilities' },
    { name: 'Templates', description: 'Workflow automation templates' },
    {
      name: 'Admin',
      description: 'Administrative controls (requires admin role)',
    },
  ],
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', example: 'john@example.com' },
                  password: { type: 'string', example: 'password123' },
                  role: {
                    type: 'string',
                    enum: ['user', 'admin'],
                    example: 'user',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User successfully registered' },
          400: { description: 'Validation error' },
          409: { description: 'Email already registered' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log into an existing account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@deeptools.ai' },
                  password: { type: 'string', example: 'admin1234' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Logged in successfully, returns JWT token' },
          401: { description: 'Invalid email or password' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current authenticated user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Profile of authenticated user' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request a password reset token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', example: 'admin@deeptools.ai' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Reset link instructions sent' },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password using token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token: { type: 'string' },
                  password: { type: 'string', example: 'newPassword123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password reset successfully' },
          401: { description: 'Invalid or expired token' },
        },
      },
    },
    '/products': {
      get: {
        tags: ['Products'],
        summary: 'List all digital products and AI tools',
        responses: {
          200: { description: 'Array of products' },
        },
      },
      post: {
        tags: ['Products'],
        summary: 'Create a new product (Admin only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'description', 'category', 'price'],
                properties: {
                  name: { type: 'string', example: 'QueryOptimizer AI' },
                  description: {
                    type: 'string',
                    example: 'AI query tuning assistant',
                  },
                  category: { type: 'string', example: 'aiAgents' },
                  price: { type: 'integer', example: 4900 },
                  version: { type: 'string', example: '1.0.0' },
                  downloadUrl: { type: 'string', example: '#' },
                  badge: { type: 'string', example: 'Popular' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Product created' },
          403: { description: 'Forbidden: Requires admin role' },
        },
      },
    },
    '/products/my/licenses': {
      get: {
        tags: ['Products'],
        summary: 'Get all licenses owned by the authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Array of owned licenses and product details' },
        },
      },
    },
    '/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Get a product by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Product details' },
          404: { description: 'Product not found' },
        },
      },
      patch: {
        tags: ['Products'],
        summary: 'Update a product (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  price: { type: 'integer' },
                  badge: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Product updated' },
        },
      },
      delete: {
        tags: ['Products'],
        summary: 'Delete a product (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Product deleted' },
        },
      },
    },
    '/products/{id}/purchase': {
      post: {
        tags: ['Products'],
        summary: 'Purchase a product and generate an active license key',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          201: { description: 'License key generated successfully' },
        },
      },
    },
    '/templates': {
      get: {
        tags: ['Templates'],
        summary: 'List automation workflow templates',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Array of templates' },
        },
      },
      post: {
        tags: ['Templates'],
        summary: 'Create a new template (Admin only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: [
                  'name',
                  'description',
                  'category',
                  'compatibility',
                  'price',
                ],
                properties: {
                  name: { type: 'string', example: 'PostgreSQL Auto-Tuner' },
                  description: {
                    type: 'string',
                    example: 'Automatic config tuner',
                  },
                  category: { type: 'string', example: 'postgresql' },
                  compatibility: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['PostgreSQL 14+', 'Docker'],
                  },
                  price: { type: 'integer', example: 0 },
                  downloadUrl: { type: 'string', example: '#' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Template created' },
        },
      },
    },
    '/templates/{id}': {
      get: {
        tags: ['Templates'],
        summary: 'Get a template by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Template details' },
        },
      },
      patch: {
        tags: ['Templates'],
        summary: 'Update a template (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Template updated' },
        },
      },
      delete: {
        tags: ['Templates'],
        summary: 'Delete a template (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Template deleted' },
        },
      },
    },
    '/templates/{id}/download': {
      post: {
        tags: ['Templates'],
        summary: 'Record download and get template download URL',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Download registered and URL returned' },
        },
      },
    },
    '/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'Get all registered users',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'List of users' },
        },
      },
    },
    '/admin/users/{id}': {
      delete: {
        tags: ['Admin'],
        summary: 'Delete a user by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'User deleted' },
        },
      },
    },
    '/admin/licenses': {
      get: {
        tags: ['Admin'],
        summary: 'Get all user licenses across all products',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'List of all licenses' },
        },
      },
    },
    '/admin/licenses/{id}/status': {
      patch: {
        tags: ['Admin'],
        summary: 'Toggle license active/revoked status',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['isActive'],
                properties: {
                  isActive: { type: 'boolean', example: false },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Updated license' },
        },
      },
    },
  },
};
