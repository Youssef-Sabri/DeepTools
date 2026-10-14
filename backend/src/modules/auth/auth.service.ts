import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { authRepository, AuthRepository } from "./auth.repository";
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "./auth.validator";
import { ApiError } from "../../utils/apiError";
import { env } from "../../config/env";
import { Role } from "@prisma/client";

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResult {
  user: UserResponse;
  token: string;
}

export class AuthService {
  private repo: AuthRepository;

  constructor(repo?: AuthRepository) {
    this.repo = repo ?? authRepository;
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = Number(env.BCRYPT_SALT_ROUNDS) || 12;
    return bcrypt.hash(password, saltRounds);
  }

  private generateToken(
    userId: string,
    role: Role,
    tokenVersion: number,
  ): string {
    const signOptions: SignOptions = {
      expiresIn: env.JWT_EXPIRES_IN as unknown as SignOptions["expiresIn"],
    };

    return jwt.sign(
      { sub: userId, role, tokenVersion },
      env.JWT_SECRET,
      signOptions,
    );
  }

  private sanitizeUser(user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): UserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async register(input: RegisterInput): Promise<AuthResult> {
    const email = input.email.toLowerCase().trim();
    const existingUser = await this.repo.findByEmail(email);
    if (existingUser) {
      throw ApiError.conflict("Email is already registered");
    }

    const passwordHash = await this.hashPassword(input.password);

    // Account creation and guest-purchase migration share ONE transaction, so a
    // failure can never leave the buyer registered while their paid orders and
    // licenses stay unlinked (BACKEND_RULES.md rule 11).
    const newUser = await this.repo.createUserAndLinkGuestPurchases({
      email,
      name: input.name,
      passwordHash,
      role: Role.USER,
    });

    const token = this.generateToken(
      newUser.id,
      newUser.role,
      newUser.tokenVersion,
    );

    return {
      user: this.sanitizeUser(newUser),
      token,
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.repo.findByEmail(input.email);

    if (!user || user.deletedAt !== null) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const token = this.generateToken(user.id, user.role, user.tokenVersion);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    if (
      !env.PASSWORD_RESET_DELIVERY_URL ||
      !env.PASSWORD_RESET_DELIVERY_KEY ||
      !env.PASSWORD_RESET_URL
    ) {
      throw new ApiError(503, "Password reset is temporarily unavailable");
    }
    const user = await this.repo.findByEmail(input.email);

    if (!user || user.deletedAt !== null) return;

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const record = await this.repo.createPasswordResetToken(
      user.id,
      tokenHash,
      expiresAt,
    );
    const resetUrl = new URL(env.PASSWORD_RESET_URL);
    resetUrl.searchParams.set("token", token);
    try {
      const response = await fetch(env.PASSWORD_RESET_DELIVERY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.PASSWORD_RESET_DELIVERY_KEY}`,
        },
        body: JSON.stringify({
          to: user.email,
          subject: "Reset your DeepTools password",
          text: `Reset your password using this link (valid for 15 minutes): ${resetUrl.toString()}`,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok)
        throw new Error(`Delivery service returned ${response.status}`);
    } catch {
      await this.repo.markTokenAsUsed(record.id);
      throw new ApiError(503, "Password reset is temporarily unavailable");
    }
  }

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const tokenHash = crypto
      .createHash("sha256")
      .update(input.token)
      .digest("hex");
    const record = await this.repo.findResetToken(tokenHash);

    if (!record || record.isUsed || record.expiresAt < new Date()) {
      throw ApiError.badRequest("Invalid or expired password reset token");
    }

    const user = await this.repo.findById(record.userId);
    if (!user || user.deletedAt !== null) {
      throw ApiError.badRequest("User does not exist or has been deactivated");
    }

    const isSamePassword = await bcrypt.compare(
      input.newPassword,
      user.passwordHash,
    );
    if (isSamePassword) {
      throw ApiError.badRequest(
        "New password cannot be the same as your current password",
      );
    }

    const newPasswordHash = await this.hashPassword(input.newPassword);

    const updated = await this.repo.consumeResetTokenAndUpdatePassword(
      record.id,
      user.id,
      user.tokenVersion,
      newPasswordHash,
    );
    if (!updated)
      throw ApiError.badRequest("Invalid or expired password reset token");
  }
}

export const authService = new AuthService();
