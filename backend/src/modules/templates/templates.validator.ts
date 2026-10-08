import { z } from 'zod';

export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  nameAr: z.string().nullable().optional(),
  description: z.string().min(1, 'Description is required'),
  descriptionAr: z.string().nullable().optional(),
  category: z.string().min(1, 'Category is required'),
  compatibility: z
    .array(z.string())
    .min(1, 'At least one compatibility item is required'),
  price: z.number().int().nonnegative('Price must be a non-negative integer'),
  downloadUrl: z.string().optional(),
  version: z.string().optional(),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
