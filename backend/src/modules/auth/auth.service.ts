import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authRepository, AuthRepository } from './auth.repository';
import { env } from '../../config/env';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from '../../utils/apiError';
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from './auth.validator';

export class AuthService {
  constructor(private readonly repo: AuthRepository = authRepository) {}

  async register(data: RegisterInput) {
    const { email, password, name } = data;
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check if user already exists
    const existingUser = await this.repo.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // 2. Hash password with bcrypt cost 12 (Rule 5.3)
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Client can never choose role; public registration is strictly 'user' (Rule 5.1)
    const newUser = await this.repo.createUser({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'user',
    });

    // 4. Generate token
    const token = this.generateToken(newUser.id, newUser.email, newUser.role);

    return {
      user: newUser,
      ...token,
    };
  }

  async login(data: LoginInput) {
    const { email, password } = data;
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Find user (lowercase email normalization, Rule 6)
    const user = await this.repo.findByEmail(normalizedEmail);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // 2. Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // 3. Generate token
    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...token,
    };
  }

  async forgotPassword(data: ForgotPasswordInput) {
    const { email } = data;
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Find user
    const user = await this.repo.findByEmail(normalizedEmail);

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // 2. Generate reset token (valid for 1 hour)
    const resetToken = jwt.sign(
      { sub: user.id, email: user.email, type: 'password-reset' },
      env.JWT_SECRET,
      { expiresIn: '1h' },
    );

    console.log(`[Password Reset] Token for ${email}: ${resetToken}`);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(data: ResetPasswordInput) {
    const { token, password } = data;

    // 1. Verify token
    let payload: { sub: string; email: string; type: string };
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as {
        sub: string;
        email: string;
        type: string;
      };
    } catch {
      throw new UnauthorizedError('Invalid or expired reset token');
    }

    if (payload.type !== 'password-reset') {
      throw new UnauthorizedError('Invalid token type');
    }

    // 2. Find user
    const user = await this.repo.findById(payload.sub);
    if (!user || user.email !== payload.email) {
      throw new NotFoundError('User not found');
    }

    // 3. Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Update password
    await this.repo.updatePassword(user.id, hashedPassword);

    return { message: 'Password has been reset successfully' };
  }

  private generateToken(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    return {
      accessToken: jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' }),
      expiresIn: 3600,
    };
  }
}

export const authService = new AuthService();
