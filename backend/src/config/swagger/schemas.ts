import { z } from 'zod';
import { registry } from './registry';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../../modules/auth/auth.validator';
import {
  createProductSchema,
  updateProductSchema,
} from '../../modules/products/products.validator';
import {
  createTemplateSchema,
  updateTemplateSchema,
} from '../../modules/templates/templates.validator';
import { toggleLicenseSchema } from '../../modules/admin/admin.validator';

// Response Envelope Helper (Section 4)
export const envelope = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    success: z.boolean().openapi({ example: true }),
    data: schema,
  });

// 1. Auth Schemas
export const RegisterInputDocs = registry.register(
  'RegisterInput',
  registerSchema.openapi({
    description: 'User registration payload',
  }),
);

export const LoginInputDocs = registry.register(
  'LoginInput',
  loginSchema.openapi({
    description: 'User login credentials',
  }),
);

export const ForgotPasswordInputDocs = registry.register(
  'ForgotPasswordInput',
  forgotPasswordSchema.openapi({
    description: 'Password recovery request',
  }),
);

export const ResetPasswordInputDocs = registry.register(
  'ResetPasswordInput',
  resetPasswordSchema.openapi({
    description: 'Password reset payload with token',
  }),
);

export const UserSchema = registry.register(
  'User',
  z.object({
    id: z
      .string()
      .uuid()
      .openapi({ example: '175e0e43-bd01-4f05-8b0d-85a15af96810' }),
    name: z.string().openapi({ example: 'John Doe' }),
    email: z.string().email().openapi({ example: 'john@example.com' }),
    role: z.string().openapi({ example: 'user' }),
    createdAt: z
      .string()
      .datetime()
      .openapi({ example: '2026-10-08T10:00:00.000Z' }),
    updatedAt: z
      .string()
      .datetime()
      .openapi({ example: '2026-10-08T10:00:00.000Z' }),
  }),
);

export const AuthResponseSchema = registry.register(
  'AuthResponse',
  z.object({
    user: UserSchema,
    accessToken: z
      .string()
      .openapi({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
    refreshToken: z
      .string()
      .openapi({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
  }),
);

// 2. Product Schemas
export const CreateProductInputDocs = registry.register(
  'CreateProductInput',
  createProductSchema.openapi({
    description:
      'Product creation payload with optional Arabic localized fields',
  }),
);

export const UpdateProductInputDocs = registry.register(
  'UpdateProductInput',
  updateProductSchema.openapi({
    description: 'Product update payload (partial)',
  }),
);

export const ProductSchema = registry.register(
  'Product',
  z.object({
    id: z
      .string()
      .uuid()
      .openapi({ example: '175e0e43-bd01-4f05-8b0d-85a15af96810' }),
    name: z.string().openapi({ example: 'QueryOptimizer AI' }),
    nameAr: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: 'مُحسّن الاستعلامات الذكي' }),
    description: z
      .string()
      .openapi({ example: 'AI agent that optimizes slow SQL queries.' }),
    descriptionAr: z.string().nullable().optional().openapi({
      example: 'وكيل ذكاء اصطناعي يقوم بتحليل استعلامات SQL البطيئة.',
    }),
    category: z.string().openapi({ example: 'aiAgents' }),
    price: z
      .number()
      .int()
      .openapi({ example: 4900, description: 'Price in cents ($49.00)' }),
    version: z.string().nullable().optional().openapi({ example: '2.1.0' }),
    downloadUrl: z.string().nullable().optional().openapi({ example: '#' }),
    badge: z.string().nullable().optional().openapi({ example: 'Popular' }),
    badgeAr: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: 'الأكثر طلباً' }),
    displayName: z
      .string()
      .optional()
      .openapi({ example: 'QueryOptimizer AI' }),
    displayDescription: z
      .string()
      .optional()
      .openapi({ example: 'AI agent that optimizes slow SQL queries.' }),
    displayBadge: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: 'Popular' }),
    sellerId: z
      .string()
      .uuid()
      .openapi({ example: 'b2d8e34a-9c71-4621-b3f8-2c286d9a1f2e' }),
    sellerName: z.string().openapi({ example: 'Verified Seller' }),
    createdAt: z
      .string()
      .datetime()
      .openapi({ example: '2026-10-08T10:00:00.000Z' }),
    updatedAt: z
      .string()
      .datetime()
      .openapi({ example: '2026-10-08T10:00:00.000Z' }),
  }),
);

export const PaginatedProductsSchema = registry.register(
  'PaginatedProducts',
  z.object({
    items: z.array(ProductSchema),
    total: z.number().int().openapi({ example: 42 }),
    page: z.number().int().openapi({ example: 1 }),
    limit: z.number().int().openapi({ example: 20 }),
    totalPages: z.number().int().openapi({ example: 3 }),
  }),
);

// 3. Template Schemas
export const CreateTemplateInputDocs = registry.register(
  'CreateTemplateInput',
  createTemplateSchema.openapi({
    description: 'Template creation payload with bilingual metadata',
  }),
);

export const UpdateTemplateInputDocs = registry.register(
  'UpdateTemplateInput',
  updateTemplateSchema.openapi({
    description: 'Template update payload (partial)',
  }),
);

export const TemplateSchema = registry.register(
  'Template',
  z.object({
    id: z
      .string()
      .uuid()
      .openapi({ example: 'a9101234-bd01-4f05-8b0d-85a15af96810' }),
    name: z.string().openapi({ example: 'Database Auto-Tuning' }),
    nameAr: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: 'الضبط التلقائي لقواعد البيانات' }),
    description: z.string().openapi({
      example: 'Automated index recommendation and buffer pool optimization.',
    }),
    descriptionAr: z.string().nullable().optional().openapi({
      example: 'توليد توصيات الفهارس الذكية وضبط الذاكرة المؤقتة تلقائياً.',
    }),
    category: z.string().openapi({ example: 'database' }),
    compatibility: z
      .array(z.string())
      .openapi({ example: ['PostgreSQL', 'MySQL'] }),
    price: z.number().int().openapi({ example: 1900 }),
    downloadsCount: z.number().int().openapi({ example: 420 }),
    isPremium: z.boolean().openapi({ example: false }),
    badge: z.string().nullable().optional().openapi({ example: 'Popular' }),
    badgeAr: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: 'الأكثر طلباً' }),
    displayName: z
      .string()
      .optional()
      .openapi({ example: 'Database Auto-Tuning' }),
    displayDescription: z
      .string()
      .optional()
      .openapi({ example: 'Automated index recommendation...' }),
    displayBadge: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: 'Popular' }),
    createdAt: z
      .string()
      .datetime()
      .openapi({ example: '2026-10-08T10:00:00.000Z' }),
    updatedAt: z
      .string()
      .datetime()
      .openapi({ example: '2026-10-08T10:00:00.000Z' }),
  }),
);

// 4. Admin Schemas
export const ToggleLicenseInputDocs = registry.register(
  'ToggleLicenseInput',
  toggleLicenseSchema.openapi({
    description: 'License activation status payload',
  }),
);

export const LicenseSchema = registry.register(
  'License',
  z.object({
    id: z
      .string()
      .uuid()
      .openapi({ example: 'c4e32100-bd01-4f05-8b0d-85a15af96810' }),
    userId: z.string().uuid(),
    productId: z.string().uuid(),
    licenseKey: z.string().openapi({ example: 'DPT-ABCD-1234-EFGH' }),
    isActive: z.boolean().openapi({ example: true }),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    user: z.object({ name: z.string(), email: z.string() }).optional(),
    product: z.object({ name: z.string() }).optional(),
  }),
);

export const OrderSchema = registry.register(
  'Order',
  z.object({
    id: z
      .string()
      .uuid()
      .openapi({ example: '7d4e5f6a-bd01-4f05-8b0d-85a15af96810' }),
    userId: z.string().uuid(),
    amount: z.number().int().openapi({
      example: 4900,
      description: 'Price in smallest currency unit (cents)',
    }),
    commissionPercent: z.number().int().openapi({ example: 10 }),
    commissionAmount: z.number().int().openapi({ example: 490 }),
    sellerAmount: z.number().int().openapi({ example: 4410 }),
    status: z.string().openapi({ example: 'completed' }),
    paymentGateway: z.string().openapi({ example: 'stripe' }),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
);

export const PurchaseResponseSchema = registry.register(
  'PurchaseResponse',
  z.object({
    message: z.string().openapi({ example: 'Purchase completed successfully' }),
    product: ProductSchema,
    license: LicenseSchema,
    order: OrderSchema,
  }),
);

export const UserLicenseSchema = registry.register(
  'UserLicense',
  z.object({
    id: z.string().uuid(),
    licenseKey: z.string().openapi({ example: 'DF-A1B2-C3D4-E5F6' }),
    isActive: z.boolean().openapi({ example: true }),
    expiresAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    productName: z.string().openapi({ example: 'QueryOptimizer AI' }),
    productNameAr: z.string().nullable().optional(),
    downloadUrl: z.string().nullable().optional(),
  }),
);

export const TemplateDownloadResponseSchema = registry.register(
  'TemplateDownloadResponse',
  z.object({
    message: z
      .string()
      .openapi({ example: 'Download registered successfully' }),
    downloadUrl: z.string().openapi({ example: '#' }),
  }),
);

// 7. Seller Upload Schemas
export const CreateUploadInputDocs = registry.register(
  'CreateUploadInput',
  z
    .object({
      file: z.string().openapi({
        type: 'string',
        format: 'binary',
        description:
          'Solution source code, script, workflow, or project archive file',
      }),
      name: z
        .string()
        .min(2)
        .max(100)
        .openapi({ example: 'Next.js SaaS Boilerplate' }),
      nameAr: z
        .string()
        .max(100)
        .optional()
        .openapi({ example: 'قالب ساس المتكامل' }),
      description: z.string().min(10).max(2000).openapi({
        example:
          'Complete enterprise boilerplate with auth, Stripe, and Prisma.',
      }),
      descriptionAr: z.string().max(2000).optional().openapi({
        example: 'قالب ساس متكامل مع المصادقة والمدفوعات وقاعدة البيانات.',
      }),
      category: z
        .enum(['workflow', 'script', 'code', 'agentic'])
        .openapi({ example: 'code' }),
      price: z
        .number()
        .int()
        .nonnegative()
        .openapi({ example: 4900, description: 'Price in cents ($49.00)' }),
      version: z
        .string()
        .default('1.0.0')
        .optional()
        .openapi({ example: '1.0.0' }),
    })
    .openapi({
      description: 'Seller file upload and product registration payload',
    }),
);

export const UpdateUploadInputDocs = registry.register(
  'UpdateUploadInput',
  z
    .object({
      file: z.string().optional().openapi({
        type: 'string',
        format: 'binary',
        description: 'Optional replacement solution file',
      }),
      name: z
        .string()
        .min(2)
        .max(100)
        .optional()
        .openapi({ example: 'Updated SaaS Boilerplate' }),
      nameAr: z
        .string()
        .max(100)
        .optional()
        .openapi({ example: 'قالب ساس محدث' }),
      description: z
        .string()
        .min(10)
        .max(2000)
        .optional()
        .openapi({ example: 'Updated description and feature breakdown.' }),
      descriptionAr: z.string().max(2000).optional().openapi({
        example: 'وصف محدث للحل البرمجي.',
      }),
      category: z
        .enum(['workflow', 'script', 'code', 'agentic'])
        .optional()
        .openapi({ example: 'code' }),
      price: z
        .number()
        .int()
        .nonnegative()
        .optional()
        .openapi({ example: 3900 }),
      version: z.string().optional().openapi({ example: '1.1.0' }),
    })
    .openapi({ description: 'Update and resubmit upload payload' }),
);

export const SellerProductSchema = registry.register(
  'SellerProduct',
  z.object({
    id: z
      .string()
      .uuid()
      .openapi({ example: '175e0e43-bd01-4f05-8b0d-85a15af96810' }),
    sellerId: z
      .string()
      .uuid()
      .openapi({ example: 'b2d8e34a-9c71-4621-b3f8-2c286d9a1f2e' }),
    name: z.string().openapi({ example: 'Next.js SaaS Boilerplate' }),
    nameAr: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: 'قالب ساس المتكامل' }),
    description: z
      .string()
      .openapi({ example: 'Complete enterprise boilerplate with auth.' }),
    descriptionAr: z.string().nullable().optional(),
    category: z.string().openapi({ example: 'code' }),
    price: z.number().int().openapi({ example: 4900 }),
    version: z.string().openapi({ example: '1.0.0' }),
    status: z
      .enum(['pending', 'approved', 'rejected'])
      .openapi({ example: 'pending' }),
    fileKey: z.string().nullable().optional().openapi({
      example: 'uploads/550e8400-e29b-41d4-a716-446655440000.zip',
    }),
    fileSize: z
      .number()
      .int()
      .nullable()
      .optional()
      .openapi({ example: 1048576 }),
    fileMime: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: 'application/zip' }),
    fileChecksum: z.string().nullable().optional().openapi({
      example:
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    }),
    rejectionNote: z.string().nullable().optional().openapi({ example: null }),
    reviewedAt: z.string().datetime().nullable().optional(),
    createdAt: z
      .string()
      .datetime()
      .openapi({ example: '2026-10-08T10:00:00.000Z' }),
    updatedAt: z
      .string()
      .datetime()
      .openapi({ example: '2026-10-08T10:00:00.000Z' }),
  }),
);

export const PaginatedSellerProductsSchema = registry.register(
  'PaginatedSellerProducts',
  z.object({
    items: z.array(SellerProductSchema),
    total: z.number().int().openapi({ example: 15 }),
    page: z.number().int().openapi({ example: 1 }),
    limit: z.number().int().openapi({ example: 20 }),
    totalPages: z.number().int().openapi({ example: 1 }),
  }),
);
