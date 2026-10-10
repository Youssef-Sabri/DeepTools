import { adminRepository, AdminRepository } from "./admin.repository";
import { NotFoundError, ConflictError } from "../../utils/apiError";
import { ListAdminUploadsQuery } from "./admin.validator";
import { prisma } from "../../config/database";
import { GetUsersQuery } from "./admin.validator";
import { ApiError } from "../../utils/apiError";
import { ApiFeatures } from "../../utils/apiFeatures";

export class AdminService {
  private repo: AdminRepository;

  constructor(repo?: AdminRepository) {
    this.repo = repo ?? adminRepository;
  }

  // 1. جلب قائمة المستخدمين مع البحث والفلترة
  async getUsers(query: GetUsersQuery) {
    // بناء الاستعلام باستخدام ApiFeatures
    const features = new ApiFeatures(query || {})
      .filter(["role"])
      .search(["name", "email"])
      .paginate(10)
      .sort();

    const prismaArgs = features.get();

    // تنفيذ الاستعلام
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        ...prismaArgs,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where: prismaArgs.where }),
    ]);

    // حساب بيانات الصفحات
    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 10;

    return {
      users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // 2. جلب بيانات مستخدم واحد
  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw ApiError.notFound("User not found");
    return user;
  }

  // 3. إحصائيات المستخدمين (الإجمالي والجدد في آخر 30 يوم)
  async getUsersInsights() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalUsers, newUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    ]);

    return {
      totalUsers,
      newUsers,
      period: "last_30_days",
    };
  }

  async toggleLicenseStatus(id: string, isActive: boolean) {
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
      throw new NotFoundError("Upload not found");
    }
    return upload;
  }

  async approveUpload(adminId: string, id: string) {
    const upload = await this.findUploadById(id);

    // Rule 4: Approving an already approved product returns 409
    if (upload.status === "approved") {
      throw new ConflictError("Product is already approved");
    }

    const updated = await this.repo.updateUploadReview(id, {
      status: "approved",
      rejectionNote: null,
      reviewedAt: new Date(),
    });

    // Rule 8: Structured audit log
    console.log(
      JSON.stringify({
        level: "info",
        action: "ADMIN_APPROVE_UPLOAD",
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
    if (upload.status === "rejected") {
      throw new ConflictError("Product is already rejected");
    }

    const updated = await this.repo.updateUploadReview(id, {
      status: "rejected",
      rejectionNote,
      reviewedAt: new Date(),
    });

    // Rule 8: Structured audit log
    console.log(
      JSON.stringify({
        level: "info",
        action: "ADMIN_REJECT_UPLOAD",
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
