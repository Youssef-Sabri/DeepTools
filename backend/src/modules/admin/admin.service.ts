import { adminRepository, AdminRepository } from './admin.repository';
import { NotFoundError } from '../../utils/apiError';

export class AdminService {
  constructor(private readonly repo: AdminRepository = adminRepository) {}

  async findAllUsers() {
    return this.repo.findAllUsers();
  }

  async deleteUser(id: string) {
    const user = await this.repo.findUserById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    await this.repo.deleteUser(id);
    return { message: 'User deleted successfully' };
  }

  async findAllLicenses() {
    return this.repo.findAllLicenses();
  }

  async toggleLicenseStatus(id: string, isActive: boolean) {
    const license = await this.repo.findLicenseById(id);
    if (!license) {
      throw new NotFoundError('License key not found');
    }

    return this.repo.updateLicenseStatus(id, isActive);
  }
}

export const adminService = new AdminService();
