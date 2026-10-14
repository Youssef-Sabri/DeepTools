import { z } from "zod";
import { Role, ProductStatus } from "@prisma/client";
import {
  paginationFields,
  paginationDepthError,
  withinPaginationDepth,
} from "../../middleware/requestBounds";

export const getUsersQuerySchema = z
  .object({
    page: paginationFields.page,
    limit: paginationFields.limit.default(10),
    search: z.string().max(100).optional(),
    role: z.nativeEnum(Role).optional(),
  })
  .refine(withinPaginationDepth, paginationDepthError);

export const rejectUploadSchema = z
  .object({
    reason: z
      .string()
      .min(10, "Rejection reason must be between 10 and 500 characters")
      .max(500, "Rejection reason must be between 10 and 500 characters")
      .optional(),
    rejectionNote: z
      .string()
      .min(10, "Rejection note must be between 10 and 500 characters")
      .max(500, "Rejection note must be between 10 and 500 characters")
      .optional(),
  })
  .refine((data) => Boolean(data.reason || data.rejectionNote), {
    message: "reason is required",
    path: ["reason"],
  });

export const listAdminUploadsQuerySchema = z
  .object({
    page: paginationFields.page,
    limit: paginationFields.limit.default(20),
    status: z.nativeEnum(ProductStatus).optional(),
  })
  .refine(withinPaginationDepth, paginationDepthError);

export const downloadUploadQuerySchema = z
  .object({
    disposition: z.enum(["inline", "attachment"]).optional(),
  })
  .strict();

export type RejectUploadInput = z.infer<typeof rejectUploadSchema>;
export type ListAdminUploadsQuery = z.infer<typeof listAdminUploadsQuerySchema>;
export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;
