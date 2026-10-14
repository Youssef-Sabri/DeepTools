import { prisma } from "../../config/database";

export class UsersRepository {
  async findActiveProfile(id: string) {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
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

  async findActiveById(id: string) {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async updateProfile(id: string, name: string) {
    return prisma.user.update({
      where: { id },
      data: { name },
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

  async updatePasswordOptimistic(
    id: string,
    currentPasswordHash: string,
    currentTokenVersion: number,
    newPasswordHash: string,
  ) {
    return prisma.user.updateMany({
      where: {
        id,
        deletedAt: null,
        passwordHash: currentPasswordHash,
        tokenVersion: currentTokenVersion,
      },
      data: {
        passwordHash: newPasswordHash,
        tokenVersion: { increment: 1 },
      },
    });
  }
}

export const usersRepository = new UsersRepository();
