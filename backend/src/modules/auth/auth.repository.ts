import { prisma } from "../../config/database";
import { User, Role } from "@prisma/client";

export interface CreateUserData {
  email: string;
  name: string;
  passwordHash: string;
  role?: Role;
}

export class AuthRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async createUser(data: CreateUserData): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash: data.passwordHash,
        role: data.role ?? Role.USER,
      },
    });
  }

  // Create single-use password reset token
  async createPasswordResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ) {
    return prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  // Find reset token record by unique hash
  async findResetToken(tokenHash: string) {
    return prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });
  }

  // Invalidate token by marking as used
  async markTokenAsUsed(tokenId: string) {
    return prisma.passwordResetToken.update({
      where: { id: tokenId },
      data: { isUsed: true },
    });
  }

  // Update user hashed password
  async updateUserPassword(userId: string, passwordHash: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }
}

export const authRepository = new AuthRepository();
