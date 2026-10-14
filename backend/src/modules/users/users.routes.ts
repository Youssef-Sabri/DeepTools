import { Router } from "express";
import { usersController } from "./users.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authRateLimiter } from "../../middleware/rateLimit.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middleware/validation.middleware";
import { updateProfileSchema, changePasswordSchema } from "./users.validator";

const router = Router();

router.use(authenticate);

router.get("/me", asyncHandler(usersController.getMe));

router.patch(
  "/me",
  validate(updateProfileSchema),
  asyncHandler(usersController.updateProfile),
);

router.put(
  "/me/password",
  authRateLimiter,
  validate(changePasswordSchema),
  asyncHandler(usersController.changePassword),
);

export default router;
