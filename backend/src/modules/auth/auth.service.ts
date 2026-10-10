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
    return bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
  }

  private generateToken(userId: string, role: Role): string {
    const signOptions: SignOptions = {
      expiresIn: env.JWT_EXPIRES_IN as unknown as SignOptions["expiresIn"],
    };

    return jwt.sign({ sub: userId, role }, env.JWT_SECRET, signOptions);
  }

  private sanitizeUser(user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
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
    const existingUser = await this.repo.findByEmail(input.email);
    if (existingUser) {
      throw ApiError.conflict("Email is already registered");
    }

    const passwordHash = await this.hashPassword(input.password);
    const newUser = await this.repo.createUser({
      email: input.email,
      name: input.name,
      passwordHash,
      role: Role.USER,
    });

    const token = this.generateToken(newUser.id, newUser.role);

    return {
      user: this.sanitizeUser(newUser),
      token,
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.repo.findByEmail(input.email);
    if (!user) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const token = this.generateToken(user.id, user.role);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    const user = await this.repo.findByEmail(input.email);

    if (!user) return;

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.repo.createPasswordResetToken(user.id, tokenHash, expiresAt);

    console.log(
      `\n[EMAIL MOCK] Password reset token for ${user.email}: ${token}\n`,
    );
  }

  // Handle actual password reset
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
    if (!user) {
      throw ApiError.badRequest("User does not exist");
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

    await this.repo.updateUserPassword(user.id, newPasswordHash);
    await this.repo.markTokenAsUsed(record.id);
  }
}

export const authService = new AuthService();
