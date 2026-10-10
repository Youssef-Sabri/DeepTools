import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const registerSchema = z.object({
    body: z.object({
        name: z
            .string({ required_error: 'Name is required' })
            .min(2, 'Name must be at least 2 characters')
            .openapi({ example: 'Mahmoud' }),
        email: z
            .string({ required_error: 'Email is required' })
            .email('Invalid email address')
            .toLowerCase()
            .openapi({ example: 'mahmoud@example.com' }),
        password: z
            .string({ required_error: 'Password is required' })
            .min(8, 'Password must be at least 8 characters')
            .openapi({ example: 'StrongPass123!' }),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z
            .string({ required_error: 'Email is required' })
            .email('Invalid email address')
            .toLowerCase()
            .openapi({ example: 'mahmoud@example.com' }),
        password: z
            .string({ required_error: 'Password is required' })
            .min(1, 'Password is required')
            .openapi({ example: 'StrongPass123!' }),
    }),
});

export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z
            .string({ required_error: 'Email is required' })
            .email('Invalid email address')
            .toLowerCase()
            .openapi({ example: 'mahmoud@example.com' }),
    }),
});

export const resetPasswordSchema = z.object({
    body: z.object({
        token: z.string({ required_error: 'Token is required' }),
        newPassword: z
            .string({ required_error: 'New password is required' })
            .min(8, 'Password must be at least 8 characters')
            .openapi({ example: 'NewStrongPass123!' }),
    }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];