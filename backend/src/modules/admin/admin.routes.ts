import { Router } from "express";
import { adminController } from "./admin.controller";
import { authenticate, requireRole } from "../../middleware/auth.middleware";
import {
  validateBody,
  validateQuery,
} from "../../middleware/validation.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  rejectUploadSchema,
  listAdminUploadsQuerySchema,
  getUsersQuerySchema,
} from "./admin.validator";
import settingsRoutes from "../settings/settings.routes";

const router = Router();

// Enforce authentication and ADMIN role across all admin routes
router.use(authenticate);
router.use(requireRole(["ADMIN"]));

// 1. User management routes
router.get(
  "/users",
  validateQuery(getUsersQuerySchema),
  asyncHandler(adminController.getUsers),
);

// 2. User registration insights
router.get("/insights/users", asyncHandler(adminController.getUsersInsights));

// 3. User details by ID
router.get("/users/:id", asyncHandler(adminController.getUserById));

// Uploads review queue & decisions
router.get(
  "/uploads",
  validateQuery(listAdminUploadsQuerySchema),
  asyncHandler(adminController.getUploads),
);
router.get("/uploads/:id", asyncHandler(adminController.getUploadById));
router.patch(
  "/uploads/:id/approve",
  asyncHandler(adminController.approveUpload),
);
router.patch(
  "/uploads/:id/reject",
  validateBody(rejectUploadSchema),
  asyncHandler(adminController.rejectUpload),
);

// System settings management
router.use("/settings", settingsRoutes);

// Platform marketplace insights
router.get(
  "/insights/marketplace",
  asyncHandler(adminController.getMarketplaceInsights),
);

export default router;