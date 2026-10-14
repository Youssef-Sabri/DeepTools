import { z } from "zod";
import {
  ARABIC_TEXT_REGEX,
  ENGLISH_TEXT_REGEX,
  HAS_ARABIC_LETTER_REGEX,
  HAS_LATIN_LETTER_REGEX,
} from "../../utils/localization";

// Validation for Latin slug (e.g. "ai-agents", "workflow-automation")
export const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Presentation / lifecycle metadata (FRONTEND_RULES.md 6 admin CRUD contract).
// These were previously accepted by the frontend and then silently stripped by
// Zod's default unknown-key handling, so the admin UI reported success while
// discarding the values. Declared before use in the schemas below.
const categoryIcon = z
  .string()
  .trim()
  .max(60, "Icon cannot exceed 60 characters")
  .optional()
  .nullable();

const categoryDisplayOrder = z.coerce
  .number({ message: "displayOrder must be a number" })
  .int("displayOrder must be an integer")
  .min(0, "displayOrder must be at least 0")
  .max(2147483647, "displayOrder is out of range")
  .optional();

export const createCategorySchema = z.object({
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
    .min(2, "Arabic name must be at least 2 characters")
    .max(100, "Arabic name cannot exceed 100 characters")
    .regex(
      ARABIC_TEXT_REGEX,
      "Arabic name must contain valid Arabic Unicode script",
    )
    .refine((val) => HAS_ARABIC_LETTER_REGEX.test(val), {
      message: "Arabic name must contain at least one authentic Arabic letter",
    }),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      slugRegex,
      "Slug must be lowercase alphanumeric with hyphens (e.g., ai-agents)",
    )
    .max(50, "Slug cannot exceed 50 characters")
    .optional(),
  description: z
    .string()
    .trim()
    .max(1000, "English description cannot exceed 1000 characters")
    .optional(),
  descriptionAr: z
    .string()
    .trim()
    .max(1000, "Arabic description cannot exceed 1000 characters")
    .optional(),
  icon: categoryIcon,
  displayOrder: categoryDisplayOrder,
});

export const updateCategorySchema = z.object({
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
    })
    .optional(),
  nameAr: z
    .string()
    .trim()
    .min(2, "Arabic name must be at least 2 characters")
    .max(100, "Arabic name cannot exceed 100 characters")
    .regex(
      ARABIC_TEXT_REGEX,
      "Arabic name must contain valid Arabic Unicode script",
    )
    .refine((val) => HAS_ARABIC_LETTER_REGEX.test(val), {
      message: "Arabic name must contain at least one authentic Arabic letter",
    })
    .optional(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      slugRegex,
      "Slug must be lowercase alphanumeric with hyphens (e.g., ai-agents)",
    )
    .max(50, "Slug cannot exceed 50 characters")
    .optional(),
  description: z
    .string()
    .trim()
    .max(1000, "English description cannot exceed 1000 characters")
    .optional(),
  descriptionAr: z
    .string()
    .trim()
    .max(1000, "Arabic description cannot exceed 1000 characters")
    .optional(),
  icon: categoryIcon,
  displayOrder: categoryDisplayOrder,
  isActive: z.boolean({ message: "isActive must be a boolean" }).optional(),
});

export const listCategoriesQuerySchema = z.object({
  lang: z.string().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
