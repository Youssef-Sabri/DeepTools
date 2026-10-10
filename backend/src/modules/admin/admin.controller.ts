import { Request, Response } from 'express';
import { adminService, AdminService } from './admin.service';
import { GetUsersQuery } from './admin.validator';

export class AdminController {
    private service: AdminService;

    constructor(service?: AdminService) {
        this.service = service ?? adminService;
    }

    // جلب قائمة المستخدمين
    getUsers = async (req: Request, res: Response): Promise<void> => {
        const query = req.query as unknown as GetUsersQuery;
        const result = await this.service.getUsers(query);

        res.status(200).json({
            success: true,
            statusCode: 200,
            data: result,
        });
    };

    // جلب إحصائيات المستخدمين
    getUsersInsights = async (req: Request, res: Response): Promise<void> => {
        const insights = await this.service.getUsersInsights();

        res.status(200).json({
            success: true,
            statusCode: 200,
            data: insights,
        });
    };

    // جلب بيانات مستخدم واحد
    getUserById = async (req: Request, res: Response): Promise<void> => {
        const id = req.params.id as string;
        const user = await this.service.getUserById(id);

        res.status(200).json({
            success: true,
            statusCode: 200,
            data: user,
        });
    };
}

export const adminController = new AdminController();