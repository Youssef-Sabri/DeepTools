import { z } from "zod";
import { Role } from "@prisma/client";

export const toggleLicenseSchema = z.object({
  isActive: z.boolean(),
});

export const getUsersQuerySchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 10)),
    search: z.string().optional(),
    role: z.nativeEnum(Role).optional(),
  }),
});

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

export const listAdminUploadsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
});

export type ToggleLicenseInput = z.infer<typeof toggleLicenseSchema>;
export type RejectUploadInput = z.infer<typeof rejectUploadSchema>;
export type ListAdminUploadsQuery = z.infer<typeof listAdminUploadsQuerySchema>;
export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>["query"];
