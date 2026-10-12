import bcrypt from "bcryptjs";
import { prisma } from "../../config/database";
import { ApiError } from "../../utils/apiError";
import { env } from "../../config/env";
import { UpdateProfileInput, ChangePasswordInput } from "./users.validator";

export class UsersService {
  async getUserProfile(userId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw ApiError.notFound("User not found or account deactivated");
    }

    return user;
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const userExists = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!userExists) {
      throw ApiError.notFound("User not found or account deactivated");
    }

    return prisma.user.update({
      where: { id: userId },
      data: { name: input.name },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null }
    });

    if (!user) throw ApiError.notFound("User not found or account deactivated");

    const isMatch = await bcrypt.compare(
      input.currentPassword,
      user.passwordHash,
    );
    if (!isMatch) {
      throw ApiError.badRequest("Incorrect current password");
    }

    const isSame = await bcrypt.compare(input.newPassword, user.passwordHash);
    if (isSame) {
      throw ApiError.badRequest(
        "New password cannot be the same as the current one",
      );
    }

    const saltRounds = Number(env.BCRYPT_SALT_ROUNDS);
    const newPasswordHash = await bcrypt.hash(input.newPassword, saltRounds);

    const updated = await prisma.user.updateMany({
      where: { id: userId, deletedAt: null, passwordHash: user.passwordHash, tokenVersion: user.tokenVersion },
      data: { passwordHash: newPasswordHash, tokenVersion: { increment: 1 } },
    });
    if (updated.count !== 1) throw ApiError.conflict("Password changed; retry with current credentials");
  }
}

export const usersService = new UsersService();
