import { Request, Response } from 'express';
import { adminService, AdminService } from './admin.service';
import { listAdminUploadsQuerySchema } from './admin.validator';
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

  toggleLicense = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const body = req.body as { isActive?: boolean };
    const isActive = Boolean(body.isActive);
    const result = await this.service.toggleLicenseStatus(id, isActive);
    res.status(200).json({ success: true, data: result });
  };

  getUploads = async (req: Request, res: Response): Promise<void> => {
    const query = listAdminUploadsQuerySchema.parse(req.query);
    const result = await this.service.findAllUploads(query);
    res.status(200).json({ success: true, data: result });
  };

  getUploadById = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const upload = await this.service.findUploadById(id);
    res.status(200).json({ success: true, data: upload });
  };

  approveUpload = async (req: Request, res: Response): Promise<void> => {
    const adminId = req.user!.id;
    const id = req.params.id as string;
    const result = await this.service.approveUpload(adminId, id);
    res.status(200).json({
      success: true,
      message: 'Product approved successfully',
      data: result,
    });
  };

  rejectUpload = async (req: Request, res: Response): Promise<void> => {
    const adminId = req.user!.id;
    const id = req.params.id as string;
    const body = req.body as { reason?: string; rejectionNote?: string };
    const rejectionNote = (body.reason || body.rejectionNote)!;
    const result = await this.service.rejectUpload(adminId, id, rejectionNote);
    res.status(200).json({
      success: true,
      message: 'Product rejected successfully',
      data: result,
    });
  };

  getMarketplaceInsights = async (
    _req: Request,
    res: Response,
  ): Promise<void> => {
    const data = await this.service.getMarketplaceInsights();
    res.status(200).json({ success: true, data });
  };
}

export const adminController = new AdminController();