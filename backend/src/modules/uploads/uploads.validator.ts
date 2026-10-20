import { z } from "zod";
import { ProductStatus } from "@prisma/client";
import {
  paginationFields,
  paginationDepthError,
  withinPaginationDepth,
} from "../../middleware/requestBounds";
import {
  ARABIC_TEXT_REGEX,
  ENGLISH_TEXT_REGEX,
  HAS_ARABIC_LETTER_REGEX,
  HAS_LATIN_LETTER_REGEX,
} from "../../utils/localization";

export const uploadCategoryEnum = z
  .string()
  .trim()
  .min(1, "Category is required")
  .max(50, "Category cannot exceed 50 characters");

export const uploadStatusEnum = z.nativeEnum(ProductStatus);

// Maximum 32-bit signed integer boundary for Postgres INTEGER cents column
export const MAX_PRICE_CENTS = 2_147_483_647;

const priceInCents = z.preprocess(
  (val) => (typeof val === "string" ? Number(val) : val),
  z
    .number({ message: "Price is required" })
    .int("Price must be an integer in cents")
    .nonnegative("Price must be greater than or equal to 0")
    .max(MAX_PRICE_CENTS, "Price exceeds the maximum supported amount"),
);

export const createUploadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "English name must be at least 2 characters")
    .max(100, "English name cannot exceed 100 characters")
    .regex(
      ENGLISH_TEXT_REGEX,
      "English name must contain valid Latin characters",
    )
    .refine((val) => HAS_LATIN_LETTER_REGEX.test(val), {
      message: "English name must contain at least one Latin letter",
    }),
  nameAr: z
    .string()
    .trim()
    .min(2, "Arabic name is required and must be at least 2 characters")
    .max(100, "Arabic name cannot exceed 100 characters")
    .regex(
      ARABIC_TEXT_REGEX,
      "Arabic name must contain valid Arabic Unicode script",
    )
    .refine((val) => HAS_ARABIC_LETTER_REGEX.test(val), {
      message: "Arabic name must contain at least one authentic Arabic letter",
    }),
  description: z
    .string()
    .trim()
    .min(10, "English description must be at least 10 characters")
    .max(2000, "English description cannot exceed 2000 characters")
    .regex(
      ENGLISH_TEXT_REGEX,
      "English description must contain valid Latin characters",
    )
    .refine((val) => HAS_LATIN_LETTER_REGEX.test(val), {
      message: "English description must contain at least one Latin letter",
    }),
  descriptionAr: z
    .string()
    .trim()
    .min(
      10,
      "Arabic description is required and must be at least 10 characters",
    )
    .max(2000, "Arabic description cannot exceed 2000 characters")
    .regex(
      ARABIC_TEXT_REGEX,
      "Arabic description must contain valid Arabic Unicode script",
    )
    .refine((val) => HAS_ARABIC_LETTER_REGEX.test(val), {
      message:
        "Arabic description must contain at least one authentic Arabic letter",
    }),
  category: uploadCategoryEnum,
  categoryId: z.string().uuid("Invalid categoryId format").optional(),
  price: priceInCents,
  version: z
    .string()
    .max(20, "Version cannot exceed 20 characters")
    .default("1.0.0")
    .optional(),
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
