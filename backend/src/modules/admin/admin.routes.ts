import { Router } from "express";
import { adminController } from "./admin.controller";
import { authenticate, requireRole } from "../../middleware/auth.middleware";
import {
  validateBody,
  validateQuery,
  validateParams,
} from "../../middleware/validation.middleware";
import { uuidIdParamsSchema } from "../../middleware/requestBounds";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  rejectUploadSchema,
  listAdminUploadsQuerySchema,
  downloadUploadQuerySchema,
  getUsersQuerySchema,
} from "./admin.validator";
import settingsRoutes from "../settings/settings.routes";
import { adminCategoriesRoutes } from "../categories/categories.routes";

const router = Router();

// Enforce authentication and ADMIN role across all admin routes
router.use(authenticate);
router.use(requireRole(["ADMIN"]));

// Category management
router.use("/categories", adminCategoriesRoutes);

// 1. User management routes
router.get(
  "/users",
  validateQuery(getUsersQuerySchema),
  asyncHandler(adminController.getUsers),
);

// 2. User registration insights
router.get("/insights/users", asyncHandler(adminController.getUsersInsights));

// 3. User details by ID
router.get(
  "/users/:id",
  validateParams(uuidIdParamsSchema),
  asyncHandler(adminController.getUserById),
);

// Uploads review queue & decisions
router.get(
  "/uploads",
  validateQuery(listAdminUploadsQuerySchema),
  asyncHandler(adminController.getUploads),
);
router.get(
  "/uploads/:id",
  validateParams(uuidIdParamsSchema),
  asyncHandler(adminController.getUploadById),
);
router.head(
  "/uploads/:id/download",
  validateParams(uuidIdParamsSchema),
  validateQuery(downloadUploadQuerySchema),
  asyncHandler(adminController.downloadUpload),
);
router.get(
  "/uploads/:id/download",
  validateParams(uuidIdParamsSchema),
  validateQuery(downloadUploadQuerySchema),
  asyncHandler(adminController.downloadUpload),
);
router.patch(
  "/uploads/:id/approve",
  validateParams(uuidIdParamsSchema),
  asyncHandler(adminController.approveUpload),
);
router.patch(
  "/uploads/:id/reject",
  validateParams(uuidIdParamsSchema),
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
