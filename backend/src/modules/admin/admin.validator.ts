import { z } from 'zod';

export const toggleLicenseSchema = z.object({
  isActive: z.boolean(),
});

export const rejectUploadSchema = z.object({
  rejectionNote: z
    .string({ message: 'Rejection note is required' })
    .min(10, 'Rejection note must be between 10 and 500 characters')
    .max(500, 'Rejection note must be between 10 and 500 characters'),
});

export const listAdminUploadsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
});

export type ToggleLicenseInput = z.infer<typeof toggleLicenseSchema>;
export type RejectUploadInput = z.infer<typeof rejectUploadSchema>;
export type ListAdminUploadsQuery = z.infer<typeof listAdminUploadsQuerySchema>;
