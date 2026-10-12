import { Router } from "express";
import { ordersController } from "./orders.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { validateQuery } from "../../middleware/validation.middleware";
import { listOrdersQuerySchema } from "./orders.validator";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

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

export default router;