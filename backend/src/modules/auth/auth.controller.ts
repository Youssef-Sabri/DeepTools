import { Request, Response } from 'express';
import { authService, AuthService } from './auth.service';
import { RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput } from './auth.validator';

export class AuthController {
    constructor(private readonly service: AuthService = authService) { }

    // Handle user registration
    register = async (req: Request, res: Response): Promise<void> => {
        const input = req.body as RegisterInput;
        const result = await this.service.register(input);

        res.status(201).json({
            success: true,
            statusCode: 201,
            message: 'User registered successfully',
            data: result,
        });
    };

    // Handle user login
    login = async (req: Request, res: Response): Promise<void> => {
        const input = req.body as LoginInput;
        const result = await this.service.login(input);

        res.status(200).json({
            success: true,
            statusCode: 200,
            message: 'Login successful',
            data: result,
        });
    };

    // Handle forgot password
    forgotPassword = async (req: Request, res: Response): Promise<void> => {
        const input = req.body as ForgotPasswordInput;
        await this.service.forgotPassword(input);

        res.status(200).json({
            success: true,
            statusCode: 200,
            message: 'If the email exists, a password reset token has been generated',
        });
    };

    // Handle reset password
    resetPassword = async (req: Request, res: Response): Promise<void> => {
        const input = req.body as ResetPasswordInput;
        await this.service.resetPassword(input);

        res.status(200).json({
            success: true,
            statusCode: 200,
            message: 'Password has been reset successfully',
        });
    };
}

export const authController = new AuthController();