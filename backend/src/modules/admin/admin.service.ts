import { adminRepository, AdminRepository } from './admin.repository';
import { NotFoundError, ConflictError } from '../../utils/apiError';
import { ListAdminUploadsQuery } from './admin.validator';

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

  async findAllUploads(query: ListAdminUploadsQuery) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const { items, total } = await this.repo.findAllUploads({
      page,
      limit,
      status: query.status,
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findUploadById(id: string) {
    const upload = await this.repo.findUploadById(id);
    if (!upload) {
      throw new NotFoundError('Upload not found');
    }
    return upload;
  }

  async approveUpload(adminId: string, id: string) {
    const upload = await this.findUploadById(id);

    // Rule 4: Approving an already approved product returns 409
    if (upload.status === 'approved') {
      throw new ConflictError('Product is already approved');
    }

    const updated = await this.repo.updateUploadReview(id, {
      status: 'approved',
      rejectionNote: null,
      reviewedAt: new Date(),
    });

    // Rule 8: Structured audit log
    console.log(
      JSON.stringify({
        level: 'info',
        action: 'ADMIN_APPROVE_UPLOAD',
        adminId,
        productId: id,
        timestamp: new Date().toISOString(),
      }),
    );

    return updated;
  }

  async rejectUpload(adminId: string, id: string, rejectionNote: string) {
    const upload = await this.findUploadById(id);

    // Rule 5: Rejecting an already rejected product returns 409
    if (upload.status === 'rejected') {
      throw new ConflictError('Product is already rejected');
    }

    const updated = await this.repo.updateUploadReview(id, {
      status: 'rejected',
      rejectionNote,
      reviewedAt: new Date(),
    });

    // Rule 8: Structured audit log
    console.log(
      JSON.stringify({
        level: 'info',
        action: 'ADMIN_REJECT_UPLOAD',
        adminId,
        productId: id,
        rejectionNote,
        timestamp: new Date().toISOString(),
      }),
    );

    return updated;
  }

  /**
   * Platform-wide marketplace metrics (uploads, orders, revenue, payouts, sellers, top products)
   */
  async getMarketplaceInsights() {
    return await this.repo.getMarketplaceInsights();
  }
}

export const adminService = new AdminService();
