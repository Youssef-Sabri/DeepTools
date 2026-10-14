import { Router } from "express";
import { ordersController } from "./orders.controller";
import {
  authenticate,
  optionalAuthenticate,
} from "../../middleware/auth.middleware";
import {
  validateQuery,
  validateBody,
} from "../../middleware/validation.middleware";
import {
  listOrdersQuerySchema,
  guestPurchaseSchema,
  guestRequestAccessSchema,
  guestVerifyAccessQuerySchema,
} from "./orders.validator";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

// Authenticated user orders
router.get(
  "/mine",
  authenticate,
  validateQuery(listOrdersQuerySchema),
  asyncHandler(ordersController.getMyPurchases),
);

router.get(
  "/sales",
  authenticate,
  validateQuery(listOrdersQuerySchema),
  asyncHandler(ordersController.getSellerSales),
);

// Guest Checkout & Access endpoints
router.post(
  "/guest-purchase",
  optionalAuthenticate,
  validateBody(guestPurchaseSchema),
  asyncHandler(ordersController.postGuestPurchase),
);

router.post(
  "/guest/request-access",
  validateBody(guestRequestAccessSchema),
  asyncHandler(ordersController.postRequestAccess),
);

router.get(
  "/guest/verify-access",
  validateQuery(guestVerifyAccessQuerySchema),
  asyncHandler(ordersController.getVerifyAccess),
);

router.get(
  "/guest/purchases",
  asyncHandler(ordersController.getGuestPurchases),
);

router.get("/guest/session", asyncHandler(ordersController.getGuestSession));

export default router;
