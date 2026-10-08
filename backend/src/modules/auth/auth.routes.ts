import { Router } from 'express';
import { authController } from './auth.controller';
import { validateBody } from '../../middleware/validation.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.validator';

const router = Router();

router.post(
  '/register',
  validateBody(registerSchema),
  asyncHandler(authController.register),
);

router.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(authController.login),
);

router.post(
  '/forgot-password',
  validateBody(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword),
);

router.post(
  '/reset-password',
  validateBody(resetPasswordSchema),
  asyncHandler(authController.resetPassword),
);

router.get('/me', authenticate, asyncHandler(authController.getProfile));

export default router;
