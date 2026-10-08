import { Request, Response } from 'express';
import { adminService, AdminService } from './admin.service';
import { listAdminUploadsQuerySchema } from './admin.validator';

export class AdminController {
  constructor(private readonly service: AdminService = adminService) {}

  getAllUsers = async (req: Request, res: Response): Promise<void> => {
    const users = await this.service.findAllUsers();
    res.status(200).json({ success: true, data: users });
  };

  deleteUser = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const result = await this.service.deleteUser(id);
    res.status(200).json({ success: true, data: result });
  };

  getAllLicenses = async (req: Request, res: Response): Promise<void> => {
    const licenses = await this.service.findAllLicenses();
    res.status(200).json({ success: true, data: licenses });
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
