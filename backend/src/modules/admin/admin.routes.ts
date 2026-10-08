import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import {
  validateBody,
  validateQuery,
} from '../../middleware/validation.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  toggleLicenseSchema,
  rejectUploadSchema,
  listAdminUploadsQuerySchema,
} from './admin.validator';
import settingsRoutes from '../settings/settings.routes';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, requireRole('admin'));

// Users management
router.get('/users', asyncHandler(adminController.getAllUsers));
router.delete('/users/:id', asyncHandler(adminController.deleteUser));

// Licenses management
router.get('/licenses', asyncHandler(adminController.getAllLicenses));
router.patch(
  '/licenses/:id/status',
  validateBody(toggleLicenseSchema),
  asyncHandler(adminController.toggleLicense),
);
router.patch(
  '/licenses/:id/toggle',
  validateBody(toggleLicenseSchema),
  asyncHandler(adminController.toggleLicense),
);

// Uploads review queue & decisions
router.get(
  '/uploads',
  validateQuery(listAdminUploadsQuerySchema),
  asyncHandler(adminController.getUploads),
);
router.get('/uploads/:id', asyncHandler(adminController.getUploadById));
router.patch(
  '/uploads/:id/approve',
  asyncHandler(adminController.approveUpload),
);
router.patch(
  '/uploads/:id/reject',
  validateBody(rejectUploadSchema),
  asyncHandler(adminController.rejectUpload),
);

// System settings management
router.use('/settings', settingsRoutes);

// Platform marketplace insights
router.get(
  '/insights/marketplace',
  asyncHandler(adminController.getMarketplaceInsights),
);

export default router;
