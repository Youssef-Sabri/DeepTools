import { z } from "zod";

export const productCategoryEnum = z.enum([
  "workflow",
  "script",
  "code",
  "agentic",
]);

export const listPublicProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  category: z
    .enum(["workflow", "script", "code", "agentic"])
    .or(z.string())
    .optional(),
  search: z.string().optional(),
  lang: z.enum(["en", "ar"]).default("en").optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  nameAr: z.string().nullable().optional(),
  description: z.string().min(1, "Description is required"),
  descriptionAr: z.string().nullable().optional(),
  category: z.string().min(1, "Category is required"),
  price: z.number().int().nonnegative("Price must be a non-negative integer"),
  version: z.string().optional(),
  downloadUrl: z.string().optional(),
  badge: z.string().nullable().optional(),
  badgeAr: z.string().nullable().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListPublicProductsQuery = z.infer<
  typeof listPublicProductsQuerySchema
>;
