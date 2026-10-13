import { z } from "zod";
import { ProductStatus } from "@prisma/client";
import {
  paginationFields,
  paginationDepthError,
  withinPaginationDepth,
} from "../../middleware/requestBounds";

export const uploadCategoryEnum = z.enum([
  "workflow",
  "script",
  "code",
  "agentic",
]);

export const uploadStatusEnum = z.nativeEnum(ProductStatus);

export const createUploadSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  nameAr: z
    .string()
    .max(100, "Arabic name cannot exceed 100 characters")
    .nullable()
    .optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description cannot exceed 2000 characters"),
  descriptionAr: z
    .string()
    .max(2000, "Arabic description cannot exceed 2000 characters")
    .nullable()
    .optional(),
  category: uploadCategoryEnum,
  price: z.preprocess(
    (val) => (typeof val === "string" ? Number(val) : val),
    z
      .number({ message: "Price is required" })
      .int("Price must be an integer in cents")
      .nonnegative("Price must be greater than or equal to 0"),
  ),
  version: z.string().default("1.0.0").optional(),
});

export const updateUploadSchema = createUploadSchema.partial();

export const listMyUploadsQuerySchema = z
  .object({
    page: paginationFields.page,
    limit: paginationFields.limit.default(20),
    status: uploadStatusEnum.optional(),
  })
  .refine(withinPaginationDepth, paginationDepthError);

export type CreateUploadInput = z.infer<typeof createUploadSchema>;
export type UpdateUploadInput = z.infer<typeof updateUploadSchema>;
export type ListMyUploadsQuery = z.infer<typeof listMyUploadsQuerySchema>;
