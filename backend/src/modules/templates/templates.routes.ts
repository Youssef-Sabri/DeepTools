import { Router } from 'express';
import { templatesController } from './templates.controller';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  createTemplateSchema,
  updateTemplateSchema,
} from './templates.validator';

const router = Router();

// Public route to list templates
router.get('/', asyncHandler(templatesController.getAll));

// Public route to get a single template
router.get('/:id', asyncHandler(templatesController.getOne));

// Admin routes
router.post(
  '/',
  authenticate,
  requireRole('admin'),
  validateBody(createTemplateSchema),
  asyncHandler(templatesController.create),
);

router.patch(
  '/:id',
  authenticate,
  requireRole('admin'),
  validateBody(updateTemplateSchema),
  asyncHandler(templatesController.update),
);

router.delete(
  '/:id',
  authenticate,
  requireRole('admin'),
  asyncHandler(templatesController.remove),
);

// Public route to download template
router.post('/:id/download', asyncHandler(templatesController.download));

export default router;
