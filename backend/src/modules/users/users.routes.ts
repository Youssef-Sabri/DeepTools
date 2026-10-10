import { Router } from "express";
import { usersController } from "./users.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middleware/validation.middleware";
import { updateProfileSchema, changePasswordSchema } from "./users.validator";

const router = Router();

// Protect all routes in this module
router.use(authenticate);

// Get current user profile
/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/me", asyncHandler(usersController.getMe));

// تحديث الاسم
router.patch(
  "/me",
  validate(updateProfileSchema),
  asyncHandler(usersController.updateProfile),
);

// تغيير كلمة المرور
router.put(
  "/me/password",
  validate(changePasswordSchema),
  asyncHandler(usersController.changePassword),
);

export default router;
