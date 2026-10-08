import { Router } from 'express';
import { settingsController } from './settings.controller';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { updateCommissionSchema } from './settings.validator';

const router = Router();

// Protect all settings endpoints with Admin authentication
router.use(authenticate, requireRole('admin'));

// Commission percentage configuration endpoints
router.get('/commission', asyncHandler(settingsController.getCommission));
router.patch(
  '/commission',
  validateBody(updateCommissionSchema),
  asyncHandler(settingsController.updateCommission),
);

export default router;
