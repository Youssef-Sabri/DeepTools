import { prisma } from '../../config/database';

export class AuthRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async countUsers() {
    return prisma.user.count();
  }

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    role: string;
  }) {
    return prisma.user.create({
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  }

  async updatePassword(userId: string, hashedPassword: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }
}

export const authRepository = new AuthRepository();
