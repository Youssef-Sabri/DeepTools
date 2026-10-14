import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { settingsController } from "./settings.controller";

const router = Router();

router.get(
  "/commission",
  authenticate,
  asyncHandler(settingsController.getCommission),
);

export default router;
