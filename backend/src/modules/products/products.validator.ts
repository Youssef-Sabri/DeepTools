import { z } from "zod";
import {
  paginationFields,
  paginationDepthError,
  withinPaginationDepth,
} from "../../middleware/requestBounds";

export const productCategoryEnum = z.enum([
  "workflow",
  "script",
  "code",
  "agentic",
]);

export const listPublicProductsQuerySchema = z
  .object({
    page: paginationFields.page,
    limit: paginationFields.limit.default(20),
    category: z
      .enum(["workflow", "script", "code", "agentic"])
      .or(z.string().max(50))
      .optional(),
    search: z.string().max(100).optional(),
    sort: z.enum(["newest", "priceAsc", "priceDesc"]).default("newest"),
    lang: z.enum(["en", "ar"]).default("en").optional(),
  })
  .refine(withinPaginationDepth, paginationDepthError);

export const getPublicProductQuerySchema = z.object({
  lang: z.enum(["en", "ar"]).optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  nameAr: z.string().nullable().optional(),
  description: z.string().min(1, "Description is required"),
  descriptionAr: z.string().nullable().optional(),
  category: z.string().min(1, "Category is required"),
  price: z.number().int().nonnegative("Price must be a non-negative integer"),
  version: z.string().optional(),
  badge: z.string().nullable().optional(),
  badgeAr: z.string().nullable().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListPublicProductsQuery = z.infer<
  typeof listPublicProductsQuerySchema
>;
