import { z } from "zod";
import {
  paginationFields,
  paginationDepthError,
  withinPaginationDepth,
} from "../../middleware/requestBounds";

export const listOrdersQuerySchema = z
  .object({
    page: paginationFields.page,
    limit: paginationFields.limit.default(20),
  })
  .refine(withinPaginationDepth, paginationDepthError);

export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;

export const guestPurchaseSchema = z.object({
  productId: z.string().uuid("Invalid product ID format"),
  // Transform order matters: Zod applies refinements left-to-right, so trim and
  // lowercase MUST precede .email(), otherwise a padded or mixed-case address is
  // rejected outright. Canonical lowercase output also keeps the value aligned
  // with the licenses_buyer_email_product_active_key unique index.
  buyerEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid buyer email format"),
  buyerName: z.string().trim().max(100).optional(),
});

export type GuestPurchaseInput = z.infer<typeof guestPurchaseSchema>;

export const guestRequestAccessSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email format"),
});

export type GuestRequestAccessInput = z.infer<typeof guestRequestAccessSchema>;

export const guestVerifyAccessQuerySchema = z.object({
  token: z.string().min(10, "Invalid access token"),
});
