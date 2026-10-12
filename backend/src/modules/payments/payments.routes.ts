import { Router, raw } from "express";
import { paymentsService } from "./payments.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { webhookRateLimiter } from "../../middleware/rateLimit.middleware";

const router = Router();

router.post("/webhooks/:provider", webhookRateLimiter, raw({ type: "*/*", limit: "256kb" }), asyncHandler(async (req, res) => {
  const result = await paymentsService.handleWebhook(req.params.provider as string, req.body as Buffer, req.headers);
  res.status(200).json({ success: true, data: result });
}));

export default router;
