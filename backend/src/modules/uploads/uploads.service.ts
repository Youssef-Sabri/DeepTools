import crypto from "crypto";
import { uploadsRepository, UploadsRepository } from "./uploads.repository";
import { storageService, StorageService } from "../../storage/storage.service";
import {
  CreateUploadInput,
  UpdateUploadInput,
  ListMyUploadsQuery,
} from "./uploads.validator";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../../utils/apiError";
import { Product, ProductStatus } from "@prisma/client";

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class UploadsService {
  constructor(
    private readonly repo: UploadsRepository = uploadsRepository,
    private readonly storage: StorageService = storageService,
  ) {}

  async create(
    sellerId: string,
    input: CreateUploadInput,
    file?: Express.Multer.File,
  ): Promise<Product> {
    if (!file || !file.buffer) {
      throw new ValidationError("A solution file is required for upload");
    }

    const fileChecksum = crypto
      .createHash("sha256")
      .update(file.buffer)
      .digest("hex");

    const fileKey = await this.storage.save(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    try {
      const stored = await this.storage.stat(fileKey);
      if (stored.size !== file.buffer.length)
        throw new ValidationError("Stored file size mismatch");
      return await this.repo.create({
        sellerId,
        name: input.name,
        nameAr: input.nameAr ?? null,
        description: input.description,
        descriptionAr: input.descriptionAr ?? null,
        category: input.category,
        price: input.price,
        version: input.version || "1.0.0",
        status: ProductStatus.PENDING,
        fileKey,
        fileSize: stored.size,
        fileMime: stored.mimeType,
        fileChecksum,
      });
    } catch (error) {
      await this.storage
        .delete(fileKey)
        .catch((cleanupError) =>
          console.error("Upload cleanup failed", cleanupError),
        );
      throw error;
    }
  }

  async findMyUploads(
    sellerId: string,
    query: ListMyUploadsQuery,
  ): Promise<PaginatedResult<Product>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.repo.findBySeller(sellerId, {
        status: query.status,
        skip,
        take: limit,
      }),
      this.repo.countBySeller(sellerId, query.status),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findMyUploadById(sellerId: string, id: string): Promise<Product> {
    const product = await this.repo.findById(id);
    if (!product || product.sellerId !== sellerId) {
      throw new NotFoundError("Upload not found");
    }
    return product;
  }

  async updateMyUpload(
    sellerId: string,
    id: string,
    input: UpdateUploadInput,
    file?: Express.Multer.File,
  ): Promise<Product> {
    const existing = await this.findMyUploadById(sellerId, id);

    let newFileKey: string | undefined;
    let newFileSize: number | undefined;
    let newFileMime: string | undefined;
    let newFileChecksum: string | undefined;

    if (file && file.buffer) {
      newFileChecksum = crypto
        .createHash("sha256")
        .update(file.buffer)
        .digest("hex");

      newFileKey = await this.storage.save(
        file.buffer,
        file.originalname,
        file.mimetype,
      );
      try {
        const stored = await this.storage.stat(newFileKey);
        if (stored.size !== file.buffer.length)
          throw new ValidationError("Stored file size mismatch");
        newFileSize = stored.size;
        newFileMime = stored.mimeType;
      } catch (error) {
        await this.storage
          .delete(newFileKey)
          .catch((cleanupError) =>
            console.error("Upload cleanup failed", cleanupError),
          );
        throw error;
      }
    }

    const shouldResetToPending =
      existing.status === ProductStatus.REJECTED ||
      existing.status === ProductStatus.APPROVED ||
      file !== undefined;

    const status = shouldResetToPending
      ? ProductStatus.PENDING
      : existing.status;
    const rejectionNote = shouldResetToPending ? null : existing.rejectionNote;
    const reviewedAt = shouldResetToPending ? null : existing.reviewedAt;

    let updated: Product | null;
    try {
      updated = await this.repo.update(id, sellerId, existing.updatedAt, {
        ...(input.name ? { name: input.name } : {}),
        ...(input.nameAr !== undefined ? { nameAr: input.nameAr } : {}),
        ...(input.description ? { description: input.description } : {}),
        ...(input.descriptionAr !== undefined
          ? { descriptionAr: input.descriptionAr }
          : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.version ? { version: input.version } : {}),
        status,
        rejectionNote,
        reviewedAt,
        ...(newFileKey
          ? {
              fileKey: newFileKey,
              fileSize: newFileSize,
              fileMime: newFileMime,
              fileChecksum: newFileChecksum,
            }
          : {}),
      });
    } catch (error) {
      if (newFileKey)
        await this.storage
          .delete(newFileKey)
          .catch((cleanupError) =>
            console.error("Upload cleanup failed", cleanupError),
          );
      throw error;
    }
    if (!updated) {
      if (newFileKey)
        await this.storage
          .delete(newFileKey)
          .catch((cleanupError) =>
            console.error("Upload cleanup failed", cleanupError),
          );
      throw new ConflictError("Upload changed; reload and try again");
    }
    if (newFileKey && existing.fileKey && existing.fileKey !== newFileKey) {
      await this.deleteUnreferencedFile(existing.fileKey);
    }
    return updated;
  }

  async deleteMyUpload(
    sellerId: string,
    id: string,
  ): Promise<{ message: string }> {
    const product = await this.findMyUploadById(sellerId, id);

    if (product.status === ProductStatus.APPROVED) {
      throw new ForbiddenError(
        "Cannot delete an approved product. Please contact support.",
      );
    }

    const deleted = await this.repo.delete(id, sellerId, product.updatedAt);
    if (!deleted)
      throw new ConflictError("Upload changed; reload and try again");
    if (product.fileKey) await this.deleteUnreferencedFile(product.fileKey);
    return { message: "Upload deleted successfully" };
  }

  private async deleteUnreferencedFile(key: string) {
    if (await this.repo.isFileReferenced(key)) return;
    await this.storage
      .delete(key)
      .catch((error) =>
        console.error("Unreferenced file cleanup failed", error),
      );
  }
}

export const uploadsService = new UploadsService();
