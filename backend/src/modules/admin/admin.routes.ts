import { Router, Request, Response, NextFunction } from "express";
import { adminController } from "./admin.controller";
import { authenticate, requireRole } from "../../middleware/auth.middleware";
import {
  validateBody,
  validateQuery,
} from "../../middleware/validation.middleware";
import { validate } from "../../middleware/validation.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  toggleLicenseSchema,
  rejectUploadSchema,
  listAdminUploadsQuerySchema,
} from "./admin.validator";
import { getUsersQuerySchema } from "./admin.validator";
import settingsRoutes from "../settings/settings.routes";

const router = Router();

// تطبيق حماية الـ Auth والـ Admin على كل مسارات هذا الموديول
router.use(authenticate);
router.use(requireRole(["ADMIN"]));

// 1. مسار جلب كل المستخدمين (مع الفلترة والبحث)
router.get(
  "/users",
  validate(getUsersQuerySchema),
  asyncHandler(adminController.getUsers),
);

// 2. مسار الإحصائيات (لازم يكون قبل الـ /:id)
router.get("/insights/users", asyncHandler(adminController.getUsersInsights));

// 3. مسار مستخدم واحد بالـ ID
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
