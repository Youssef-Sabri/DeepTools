import { Router, Request, Response, NextFunction } from 'express';
import { adminController } from './admin.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validation.middleware';
import { getUsersQuerySchema } from './admin.validator';
import { ApiError } from '../../utils/apiError';
import { Role } from '@prisma/client';

const router = Router();

// Middleware سريع للتأكد إن المستخدم ADMIN
const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== Role.ADMIN) {
        throw ApiError.forbidden('Access denied. Admins only.');
    }
    next();
};

// تطبيق حماية الـ Auth والـ Admin على كل مسارات هذا الموديول
router.use(authenticate);
router.use(authorizeAdmin);

// 1. مسار جلب كل المستخدمين (مع الفلترة والبحث)
router.get(
    '/users',
    validate(getUsersQuerySchema),
    asyncHandler(adminController.getUsers)
);

// 2. مسار الإحصائيات (لازم يكون قبل الـ /:id)
router.get(
    '/insights/users',
    asyncHandler(adminController.getUsersInsights)
);

// 3. مسار مستخدم واحد بالـ ID
router.get(
    '/users/:id',
    asyncHandler(adminController.getUserById)
);

export default router;