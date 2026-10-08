import { z } from 'zod';

export const uploadCategoryEnum = z.enum([
  'workflow',
  'script',
  'code',
  'agentic',
]);

export const uploadStatusEnum = z.enum(['pending', 'approved', 'rejected']);

/**
 * Validator for creating a new seller upload (multipart/form-data text fields)
 */
export const createUploadSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  nameAr: z
    .string()
    .max(100, 'Arabic name cannot exceed 100 characters')
    .nullable()
    .optional(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description cannot exceed 2000 characters'),
  descriptionAr: z
    .string()
    .max(2000, 'Arabic description cannot exceed 2000 characters')
    .nullable()
    .optional(),
  category: uploadCategoryEnum,
  price: z.preprocess(
    (val) => (typeof val === 'string' ? Number(val) : val),
    z
      .number({ message: 'Price is required' })
      .int('Price must be an integer in cents')
      .nonnegative('Price must be greater than or equal to 0'),
  ),
  version: z.string().default('1.0.0').optional(),
});

/**
 * Validator for updating an existing upload (PUT /api/v1/uploads/mine/:id)
 */
export const updateUploadSchema = createUploadSchema.partial();

/**
 * Validator for listing own uploads with pagination and filtering
 */
export const listMyUploadsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: uploadStatusEnum.optional(),
});

export type CreateUploadInput = z.infer<typeof createUploadSchema>;
export type UpdateUploadInput = z.infer<typeof updateUploadSchema>;
export type ListMyUploadsQuery = z.infer<typeof listMyUploadsQuerySchema>;
