import { Router } from "express";
import { productsController } from "./products.controller";
import { authenticate, requireRole } from "../../middleware/auth.middleware";
import {
  validateBody,
  validateQuery,
  validateParams,
} from "../../middleware/validation.middleware";
import { uuidIdParamsSchema } from "../../middleware/requestBounds";
import { authRateLimiter } from "../../middleware/rateLimit.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createProductSchema,
  updateProductSchema,
  listPublicProductsQuerySchema,
  getPublicProductQuerySchema,
} from "./products.validator";

const router = Router();

// Public route to list products
router.get(
  "/",
  validateQuery(listPublicProductsQuerySchema),
  asyncHandler(productsController.getAll),
);

// Authenticated route for user licenses - MUST be defined before /:id
router.get(
  "/my/licenses",
  authenticate,
  asyncHandler(productsController.getMyLicenses),
);

// Public route to get a single product
router.get(
  "/:id",
  validateParams(uuidIdParamsSchema),
  validateQuery(getPublicProductQuerySchema),
  asyncHandler(productsController.getOne),
);

// Admin routes
router.post(
  "/",
  authenticate,
  requireRole("admin"),
  validateBody(createProductSchema),
  asyncHandler(productsController.create),
);

router.patch(
  "/:id",
  authenticate,
  requireRole("admin"),
  validateParams(uuidIdParamsSchema),
  validateBody(updateProductSchema),
  asyncHandler(productsController.update),
);

router.delete(
  "/:id",
  authenticate,
  requireRole("admin"),
  validateParams(uuidIdParamsSchema),
  asyncHandler(productsController.remove),
);

// Authenticated route to purchase product (rate-limited, Rule 5.5)
router.post(
  "/:id/purchase",
  authRateLimiter,
  authenticate,
  validateParams(uuidIdParamsSchema),
  asyncHandler(productsController.purchase),
);

// Authenticated route to stream purchased file
router.head(
  "/:id/download",
  authenticate,
  validateParams(uuidIdParamsSchema),
  asyncHandler(productsController.download),
);
router.get(
  "/:id/download",
  authenticate,
  validateParams(uuidIdParamsSchema),
  asyncHandler(productsController.download),
);

export default router;
