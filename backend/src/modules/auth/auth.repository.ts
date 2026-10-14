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

  async consumeResetTokenAndUpdatePassword(
    tokenId: string,
    userId: string,
    tokenVersion: number,
    passwordHash: string,
  ): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
      const claimed = await tx.passwordResetToken.updateMany({
        where: {
          id: tokenId,
          userId,
          isUsed: false,
          expiresAt: { gt: new Date() },
        },
        data: { isUsed: true },
      });
      if (claimed.count !== 1) return false;
      const updated = await tx.user.updateMany({
        where: { id: userId, deletedAt: null, tokenVersion },
        data: { passwordHash, tokenVersion: { increment: 1 } },
      });
      if (updated.count !== 1) return false;
      await tx.passwordResetToken.updateMany({
        where: { userId, isUsed: false },
        data: { isUsed: true },
      });
      return true;
    });
  }

  async linkGuestOrdersAndLicenses(
    email: string,
    userId: string,
  ): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    if (typeof prisma.$transaction === "function") {
      await prisma.$transaction(async (tx) => {
        await tx.order.updateMany({
          where: {
            buyerEmail: normalizedEmail,
            userId: null,
          },
          data: { userId },
        });

        await tx.license.updateMany({
          where: {
            buyerEmail: normalizedEmail,
            userId: null,
          },
          data: { userId },
        });
      });
    } else {
      if (typeof prisma.order?.updateMany === "function") {
        await prisma.order.updateMany({
          where: { buyerEmail: normalizedEmail, userId: null },
          data: { userId },
        });
      }
      if (typeof prisma.license?.updateMany === "function") {
        await prisma.license.updateMany({
          where: { buyerEmail: normalizedEmail, userId: null },
          data: { userId },
        });
      }
    }
  }
}

export const authRepository = new AuthRepository();
