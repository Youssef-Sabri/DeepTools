import { z } from "zod";
import {
  paginationFields,
  paginationDepthError,
  withinPaginationDepth,
} from "../../middleware/requestBounds";
import { MAX_PRICE_CENTS } from "../uploads/uploads.validator";

export const listPublicProductsQuerySchema = z
  .object({
    page: paginationFields.page,
    limit: paginationFields.limit.default(20),
    // Dynamic category slug filter
    category: z.string().max(50).optional(),
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
  category: z.string().trim().min(1, "Category is required").max(50),
  // Bounded to the Postgres INTEGER range; without this an out-of-range price
  // passes z.number().int() and surfaces as an opaque 500.
  price: z
    .number()
    .int("Price must be an integer in cents")
    .nonnegative("Price must be a non-negative integer")
    .max(MAX_PRICE_CENTS, "Price exceeds the maximum supported amount"),
  version: z.string().max(20).optional(),
  badge: z.string().max(20).nullable().optional(),
  badgeAr: z.string().max(30).nullable().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListPublicProductsQuery = z.infer<
  typeof listPublicProductsQuerySchema
>;
