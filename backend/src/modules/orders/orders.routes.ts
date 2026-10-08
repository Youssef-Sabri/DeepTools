import { Router } from 'express';
import { ordersController } from './orders.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

// Authenticated user order history routes
router.get(
  '/mine',
  authenticate,
  asyncHandler(ordersController.getMyPurchases),
);
router.get(
  '/sales',
  authenticate,
  asyncHandler(ordersController.getSellerSales),
);

export default router;
