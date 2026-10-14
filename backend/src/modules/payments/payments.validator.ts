import { z } from "zod";

export const webhookParamsSchema = z.object({
  provider: z.string().regex(/^[a-z0-9_-]{2,50}$/, "Invalid payment provider"),
});

export type WebhookParams = z.infer<typeof webhookParamsSchema>;
