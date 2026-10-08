import { z } from 'zod';

export const toggleLicenseSchema = z.object({
  isActive: z.boolean(),
});

export type ToggleLicenseInput = z.infer<typeof toggleLicenseSchema>;
