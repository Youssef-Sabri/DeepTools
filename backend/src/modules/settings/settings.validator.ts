import { z } from "zod";

/** Validation schema for updating commission percentage (0-100 inclusive). */
export const updateCommissionSchema = z.object({
  commissionPercent: z
    .number({ message: "commissionPercent is required" })
    .int("commissionPercent must be an integer")
    .min(0, "commissionPercent must be at least 0")
    .max(100, "commissionPercent cannot exceed 100"),
});

export type UpdateCommissionInput = z.infer<typeof updateCommissionSchema>;
