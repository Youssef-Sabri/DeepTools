import { prisma } from '../../config/database';
import { User, Role } from '@prisma/client';

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

    // الإنشاء باستخدام userId
    async createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date) {
        return prisma.passwordResetToken.create({
            data: {
                userId,
                tokenHash,
                expiresAt,
            },
        });
    }

    // البحث الدقيق باستخدام tokenHash
    async findResetToken(tokenHash: string) {
        return prisma.passwordResetToken.findUnique({
            where: { tokenHash },
        });
    }

    // التحديث لحالة "مُستخدم"
    async markTokenAsUsed(tokenId: string) {
        return prisma.passwordResetToken.update({
            where: { id: tokenId },
            data: { isUsed: true },
        });
    }

    // تحديث كلمة المرور
    async updateUserPassword(userId: string, passwordHash: string) {
        return prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });
    }
}

export const authRepository = new AuthRepository();