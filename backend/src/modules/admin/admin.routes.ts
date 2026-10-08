import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { toggleLicenseSchema } from './admin.validator';

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

export default router;
