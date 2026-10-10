import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validation.middleware';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.validator';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

// Register new public user
router.post(
    '/register',
    validate(registerSchema),
    asyncHandler(authController.register),
);

// Authenticate existing user
router.post(
    '/login',
    validate(loginSchema),
    asyncHandler(authController.login),
);

// Forgot password
router.post(
    '/forgot-password',
    validate(forgotPasswordSchema),
    asyncHandler(authController.forgotPassword)
);

// Reset password
router.post(
    '/reset-password',
    validate(resetPasswordSchema),
    asyncHandler(authController.resetPassword)
);

export default router;