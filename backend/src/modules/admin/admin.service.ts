import { prisma } from '../../config/database';
import { GetUsersQuery } from './admin.validator';
import { ApiError } from '../../utils/apiError';
import { ApiFeatures } from '../../utils/apiFeatures';

export class AdminService {
    // 1. جلب قائمة المستخدمين مع البحث والفلترة
    async getUsers(query: GetUsersQuery) {
        // بناء الاستعلام باستخدام ApiFeatures
        const features = new ApiFeatures(query || {})
            .filter(['role'])
            .search(['name', 'email'])
            .paginate(10)
            .sort();

        const prismaArgs = features.get();

        // تنفيذ الاستعلام
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                ...prismaArgs,
                select: { id: true, email: true, name: true, role: true, createdAt: true }
            }),
            prisma.user.count({ where: prismaArgs.where })
        ]);

        // حساب بيانات الصفحات
        const page = Number(query?.page) || 1;
        const limit = Number(query?.limit) || 10;

        return {
            users,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
        };
    }

    // 2. جلب بيانات مستخدم واحد
    async getUserById(id: string) {
        const user = await prisma.user.findUnique({
            where: { id },
            select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true }
        });

        if (!user) throw ApiError.notFound('User not found');
        return user;
    }

    // 3. إحصائيات المستخدمين (الإجمالي والجدد في آخر 30 يوم)
    async getUsersInsights() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [totalUsers, newUsers] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } })
        ]);

        return {
            totalUsers,
            newUsers,
            period: 'last_30_days'
        };
    }
}

export const adminService = new AdminService();