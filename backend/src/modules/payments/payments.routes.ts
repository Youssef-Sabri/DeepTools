import { Router, raw } from "express";
import { paymentsController } from "./payments.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { webhookRateLimiter } from "../../middleware/rateLimit.middleware";
import { validateParams } from "../../middleware/validation.middleware";
import { webhookParamsSchema } from "./payments.validator";

const router = Router();

router.post(
  "/webhooks/:provider",
  webhookRateLimiter,
  validateParams(webhookParamsSchema),
  raw({ type: "*/*", limit: "256kb" }),
  asyncHandler(paymentsController.handleWebhook),
);

export default router;
