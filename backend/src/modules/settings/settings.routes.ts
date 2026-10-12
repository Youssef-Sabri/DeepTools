import { Router } from "express";
import { settingsController } from "./settings.controller";
import { authenticate, requireRole } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { updateCommissionSchema } from "./settings.validator";
import { Role } from "@prisma/client"; 

const router = Router();

router.use(authenticate, requireRole([Role.ADMIN]));

router.get("/commission", asyncHandler(settingsController.getCommission));

router.patch(
  "/commission",
  validateBody(updateCommissionSchema),
  asyncHandler(settingsController.updateCommission),
);

export default router;