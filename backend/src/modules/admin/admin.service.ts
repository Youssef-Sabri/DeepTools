import path from "path";
import { Response } from "express";
import { adminRepository, AdminRepository } from "./admin.repository";
import { NotFoundError, ConflictError, ApiError } from "../../utils/apiError";
import { ListAdminUploadsQuery, GetUsersQuery } from "./admin.validator";
import { prisma } from "../../config/database";
import { ApiFeatures } from "../../utils/apiFeatures";
import { ProductStatus } from "@prisma/client";
import { storageService } from "../../storage/storage.service";
import { uploadsRepository } from "../uploads/uploads.repository";

export class AdminService {
  private repo: AdminRepository;

  constructor(repo?: AdminRepository) {
    this.repo = repo ?? adminRepository;
  }

  async getUsers(query: GetUsersQuery) {
    const features = new ApiFeatures(query || {})
      .filter(["role"])
      .search(["name", "email"])
      .paginate(10)
      .sort();

    const prismaArgs = features.get();

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        ...prismaArgs,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          deletedAt: true,
        },
      }),
      prisma.user.count({ where: prismaArgs.where }),
    ]);

    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 10;

    return {
      users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

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
        deletedAt: true,
      },
    });

    if (!user) throw ApiError.notFound("User not found");
    return user;
  }

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
    if (!upload) throw new NotFoundError("Upload not found");
    return upload;
  }

  async downloadUpload(
    id: string,
    res: Response,
    headOnly = false,
    disposition: "inline" | "attachment" = "attachment",
  ): Promise<void> {
    const upload = await this.findUploadById(id);
    if (!upload.fileKey)
      throw new ConflictError("Upload has no file to review");

    let file: { size: number; mimeType: string };
    try {
      file = await storageService.stat(upload.fileKey);
    } catch {
      throw new ConflictError("Uploaded file is unavailable");
    }

    const extension = path.extname(upload.fileKey);
    const safeName = upload.name.replace(/[^a-zA-Z0-9_\-.]/g, "_") || "asset";
    const filename = safeName.toLowerCase().endsWith(extension.toLowerCase())
      ? safeName
      : `${safeName}${extension}`;
    // Source files (including HTML and JavaScript) must never execute on this origin.
    const previewMime =
      file.mimeType === "application/pdf"
        ? "application/pdf"
        : /^(image\/png|image\/jpeg|image\/gif|image\/webp)$/.test(
              file.mimeType,
            )
          ? file.mimeType
          : file.mimeType.startsWith("text/") ||
              [
                "application/json",
                "application/xml",
                "application/yaml",
                "application/toml",
              ].includes(file.mimeType)
            ? "text/plain; charset=utf-8"
            : "application/octet-stream";
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="${filename}"`,
    );
    res.setHeader(
      "Content-Type",
      disposition === "inline" ? previewMime : "application/octet-stream",
    );
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");

    if (headOnly) {
      res.status(200).end();
      return;
    }
    await storageService.stream(upload.fileKey, res);
  }

  async approveUpload(adminId: string, id: string) {
    const upload = await this.findUploadById(id);

    if (upload.status !== ProductStatus.PENDING)
      throw new ConflictError("Only pending products can be approved");
    if (
      !upload.fileKey ||
      !upload.fileSize ||
      !upload.fileMime ||
      !upload.fileChecksum
    )
      throw new ConflictError("Product has no valid uploaded file");
    try {
      const file = await storageService.stat(upload.fileKey);
      if (file.size !== upload.fileSize || file.mimeType !== upload.fileMime)
        throw new Error("File metadata mismatch");
      if (
        (await storageService.checksum(upload.fileKey)) !== upload.fileChecksum
      )
        throw new Error("File checksum mismatch");
    } catch {
      throw new ConflictError("Uploaded file is unavailable or invalid");
    }

    const updated = await this.repo.updateUploadReview(id, upload.updatedAt, {
      status: ProductStatus.APPROVED,
      rejectionNote: null,
      reviewedAt: new Date(),
      approvedFileKey: upload.fileKey,
      approvedFileMime: upload.fileMime,
    });
    if (!updated) throw new ConflictError("Product changed during review");
    if (upload.approvedFileKey && upload.approvedFileKey !== upload.fileKey) {
      try {
        if (
          !(await uploadsRepository.isFileReferenced(upload.approvedFileKey))
        ) {
          await storageService.delete(upload.approvedFileKey);
        }
      } catch (error) {
        console.error("Unreferenced approved file cleanup failed", error);
      }
    }

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

    if (upload.status !== ProductStatus.PENDING)
      throw new ConflictError("Only pending products can be rejected");

    const updated = await this.repo.updateUploadReview(id, upload.updatedAt, {
      status: ProductStatus.REJECTED,
      rejectionNote,
      reviewedAt: new Date(),
    });
    if (!updated) throw new ConflictError("Product changed during review");

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

  async getMarketplaceInsights() {
    return await this.repo.getMarketplaceInsights();
  }
}

export const adminService = new AdminService();
