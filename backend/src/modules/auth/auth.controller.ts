import { Request, Response } from "express";
import { authService, AuthService } from "./auth.service";
import { clearGuestSession, clearSession, setSession } from "./session";
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "./auth.validator";

export class AuthController {
  constructor(private readonly service: AuthService = authService) {}

  // Handle user registration
  register = async (req: Request, res: Response): Promise<void> => {
    const input = req.body as RegisterInput;
    const result = await this.service.register(input);
    setSession(res, result.token);

    // Registration upgrades guest purchases to the account; clear guest session.
    clearGuestSession(res);

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: req.t("auth.registered"),
      data: { user: result.user },
    });
  };

  // Handle user login
  login = async (req: Request, res: Response): Promise<void> => {
    const input = req.body as LoginInput;
    const result = await this.service.login(input);
    setSession(res, result.token);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: req.t("auth.loginSuccess"),
      data: { user: result.user },
    });
  };

  logout = (_req: Request, res: Response): void => {
    clearSession(res);
    // End the guest session too, so signing out does not silently leave a
    // separate 1-hour guest-scoped session active in the same browser.
    clearGuestSession(res);
    res.status(204).end();
  };

  // Handle forgot password
  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    const input = req.body as ForgotPasswordInput;
    await this.service.forgotPassword(input);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: req.t("auth.forgotPasswordSent"),
    });
  };

  // Handle reset password
  resetPassword = async (req: Request, res: Response): Promise<void> => {
    const input = req.body as ResetPasswordInput;
    await this.service.resetPassword(input);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: req.t("auth.passwordResetSuccess"),
    });
  };
}

export const authController = new AuthController();
