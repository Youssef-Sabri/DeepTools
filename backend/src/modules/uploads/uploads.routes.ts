import { Router } from "express";
import multer from "multer";
import { uploadsController } from "./uploads.controller";
import {
  createUploadSchema,
  updateUploadSchema,
  listMyUploadsQuerySchema,
} from "./uploads.validator";
import { authenticate } from "../../middleware/auth.middleware";
import { authRateLimiter } from "../../middleware/rateLimit.middleware";
import {
  validateBody,
  validateQuery,
  validateParams,
} from "../../middleware/validation.middleware";
import { uuidIdParamsSchema } from "../../middleware/requestBounds";
import { asyncHandler } from "../../utils/asyncHandler";
import { MAX_FILE_SIZE_BYTES } from "../../storage/storage.config";

const router = Router();

// Configure Multer with in-memory storage and max size enforcement from config
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
});

router.post(
  "/",
  authRateLimiter,
  authenticate,
  upload.single("file"),
  validateBody(createUploadSchema),
  asyncHandler(uploadsController.create),
);

router.get(
  "/mine",
  authenticate,
  validateQuery(listMyUploadsQuerySchema),
  asyncHandler(uploadsController.getMyUploads),
);

router.get(
  "/mine/:id",
  authenticate,
  validateParams(uuidIdParamsSchema),
  asyncHandler(uploadsController.getMyUploadById),
);

router.put(
  "/mine/:id",
  authRateLimiter,
  authenticate,
  validateParams(uuidIdParamsSchema),
  upload.single("file"),
  validateBody(updateUploadSchema),
  asyncHandler(uploadsController.updateMyUpload),
);

router.delete(
  "/mine/:id",
  authenticate,
  validateParams(uuidIdParamsSchema),
  asyncHandler(uploadsController.deleteMyUpload),
);

export default router;
