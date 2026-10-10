import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/apiError';
import { env } from '../../config/env';
import { UpdateProfileInput, ChangePasswordInput } from './users.validator';

export class UsersService {
    // Fetch user profile without sensitive data
    async getUserProfile(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
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
            throw ApiError.notFound('User not found');
        }

        return user;
    }

    async updateProfile(userId: string, input: UpdateProfileInput) {
        return prisma.user.update({
            where: { id: userId },
            data: { name: input.name },
            select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true },
        });
    }

    // تغيير كلمة المرور
    async changePassword(userId: string, input: ChangePasswordInput) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw ApiError.notFound('User not found');

        // 1. التأكد من صحة الباسورد الحالي
        const isMatch = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!isMatch) {
            throw ApiError.badRequest('Incorrect current password');
        }

        // 2. التأكد إن الباسورد الجديد مختلف عن القديم
        const isSame = await bcrypt.compare(input.newPassword, user.passwordHash);
        if (isSame) {
            throw ApiError.badRequest('New password cannot be the same as the current one');
        }

        // 3. تشفير وحفظ الباسورد الجديد
        const newPasswordHash = await bcrypt.hash(input.newPassword, Number(env.BCRYPT_SALT_ROUNDS));
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newPasswordHash },
        });
    }
}

export const usersService = new UsersService();