import { Request, Response } from 'express';
import { adminService, AdminService } from './admin.service';

export class AdminController {
  constructor(private readonly service: AdminService = adminService) {}

  getAllUsers = async (req: Request, res: Response): Promise<void> => {
    const users = await this.service.findAllUsers();
    res.status(200).json(users);
  };

  deleteUser = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const result = await this.service.deleteUser(id);
    res.status(200).json(result);
  };

  getAllLicenses = async (req: Request, res: Response): Promise<void> => {
    const licenses = await this.service.findAllLicenses();
    res.status(200).json(licenses);
  };

  toggleLicense = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const body = req.body as { isActive?: boolean };
    const isActive = Boolean(body.isActive);
    const result = await this.service.toggleLicenseStatus(id, isActive);
    res.status(200).json(result);
  };
}

export const adminController = new AdminController();
