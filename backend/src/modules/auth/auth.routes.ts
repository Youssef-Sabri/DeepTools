import { Router } from "express";
import { authController } from "./auth.controller";
import { validate } from "../../middleware/validation.middleware";
import { authRateLimiter } from "../../middleware/rateLimit.middleware";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.validator";
import { asyncHandler } from "../../utils/asyncHandler";
import { SESSION_COOKIE, readCookie, validSessionCsrf } from "./session";
import { ApiError } from "../../utils/apiError";

const router = Router();


router.use(authRateLimiter);

// Register new public user
router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(authController.register),
);

// Authenticate existing user
router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(authController.login),
);

router.post("/logout", (req, _res, next) => {
  const token = readCookie(req, SESSION_COOKIE);
  if (token && !validSessionCsrf(req, token)) return next(ApiError.forbidden("CSRF verification failed"));
  next();
}, asyncHandler(authController.logout));

// Forgot password
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword),
);

// Reset password
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  asyncHandler(authController.resetPassword),
);

export default router;
