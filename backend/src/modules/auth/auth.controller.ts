import { Request, Response } from 'express';
import { authService, AuthService } from './auth.service';
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from './auth.validator';

export class AuthController {
  constructor(private readonly service: AuthService = authService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.register(req.body as RegisterInput);
    res.status(201).json(result);
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.login(req.body as LoginInput);
    res.status(200).json(result);
  };

  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.forgotPassword(
      req.body as ForgotPasswordInput,
    );
    res.status(200).json(result);
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.resetPassword(
      req.body as ResetPasswordInput,
    );
    res.status(200).json(result);
  };

  getProfile = (req: Request, res: Response): void => {
    res.status(200).json(req.user);
  };
}

export const authController = new AuthController();
