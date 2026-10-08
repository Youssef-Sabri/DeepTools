import { Router } from 'express';
import multer from 'multer';
import { uploadsController } from './uploads.controller';
import { createUploadSchema, updateUploadSchema } from './uploads.validator';
import { authenticate } from '../../middleware/auth.middleware';
import { authRateLimiter } from '../../middleware/rateLimit.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { MAX_FILE_SIZE_BYTES } from '../../storage/storage.config';

const router = Router();

// Configure Multer with in-memory storage and max size enforcement from config
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
});

/**
 * POST /api/v1/uploads
 * Upload a solution file and create a new pending marketplace product.
 */
router.post(
  '/',
  authRateLimiter,
  authenticate,
  upload.single('file'),
  validateBody(createUploadSchema),
  asyncHandler(uploadsController.create),
);

/**
 * GET /api/v1/uploads/mine
 * List the current seller's own uploads.
 */
router.get('/mine', authenticate, asyncHandler(uploadsController.getMyUploads));

/**
 * GET /api/v1/uploads/mine/:id
 * Retrieve details of a specific upload owned by the current seller.
 */
router.get(
  '/mine/:id',
  authenticate,
  asyncHandler(uploadsController.getMyUploadById),
);

/**
 * PUT /api/v1/uploads/mine/:id
 * Edit and resubmit an upload (optionally replacing the attached file).
 */
router.put(
  '/mine/:id',
  authenticate,
  upload.single('file'),
  validateBody(updateUploadSchema),
  asyncHandler(uploadsController.updateMyUpload),
);

/**
 * DELETE /api/v1/uploads/mine/:id
 * Delete a pending or rejected upload (removes disk file).
 */
router.delete(
  '/mine/:id',
  authenticate,
  asyncHandler(uploadsController.deleteMyUpload),
);

export default router;
