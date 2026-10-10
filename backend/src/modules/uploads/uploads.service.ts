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
} from "../../utils/apiError";
import { Product } from "@prisma/client";

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

  /**
   * Upload a new solution file and create a product in 'pending' status.
   */
  async create(
    sellerId: string,
    input: CreateUploadInput,
    file?: Express.Multer.File,
  ): Promise<Product> {
    if (!file || !file.buffer) {
      throw new ValidationError("A solution file is required for upload");
    }

    // 1. Calculate SHA-256 checksum of the file
    const fileChecksum = crypto
      .createHash("sha256")
      .update(file.buffer)
      .digest("hex");

    // 2. Save file via private storage service (enforces size limit & magic byte validation)
    const fileKey = await this.storage.save(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    // 3. Persist product record in database with status 'pending'
    return this.repo.create({
      sellerId,
      name: input.name,
      nameAr: input.nameAr ?? null,
      description: input.description,
      descriptionAr: input.descriptionAr ?? null,
      category: input.category,
      price: input.price,
      version: input.version || "1.0.0",
      status: "pending",
      fileKey,
      fileSize: file.buffer.length,
      fileMime: file.mimetype,
      fileChecksum,
    });
  }

  /**
   * List the authenticated user's own uploads with pagination and status filtering.
   */
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

  /**
   * Retrieve a specific upload owned by the authenticated seller.
   */
  async findMyUploadById(sellerId: string, id: string): Promise<Product> {
    const product = await this.repo.findById(id);
    if (!product || product.sellerId !== sellerId) {
      throw new NotFoundError("Upload not found");
    }
    return product;
  }

  /**
   * Edit and resubmit an upload.
   * If rejected or approved, resets status to 'pending' and clears rejectionNote.
   */
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

    // If replacement file is provided, process and save new file
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
      newFileSize = file.buffer.length;
      newFileMime = file.mimetype;

      // Delete old file from storage if different
      if (existing.fileKey) {
        await this.storage.delete(existing.fileKey).catch(() => {});
      }
    }

    // Business Rules:
    // - Editing a rejected product resets status to pending and clears rejectionNote.
    // - Editing an approved product moves it back to pending.
    const shouldResetToPending =
      existing.status === "rejected" ||
      existing.status === "approved" ||
      file !== undefined;

    const status = shouldResetToPending ? "pending" : existing.status;
    const rejectionNote = shouldResetToPending ? null : existing.rejectionNote;
    const reviewedAt = shouldResetToPending ? null : existing.reviewedAt;

    return this.repo.update(id, {
      ...(input.name ? { name: input.name } : {}),
      ...(input.nameAr !== undefined ? { nameAr: input.nameAr } : {}),
      ...(input.description ? { description: input.description } : {}),
      ...(input.descriptionAr !== undefined
        ? { descriptionAr: input.descriptionAr }
        : {}),
      ...(input.category ? { category: input.category } : {}),
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
  }

  /**
   * Delete an upload owned by the seller.
   * Rejects deletion of approved products with 403.
   * Deletes the associated file from disk.
   */
  async deleteMyUpload(
    sellerId: string,
    id: string,
  ): Promise<{ message: string }> {
    const product = await this.findMyUploadById(sellerId, id);

    // Rule 6: Deleting an approved product returns 403
    if (product.status === "approved") {
      throw new ForbiddenError(
        "Cannot delete an approved product. Please contact support.",
      );
    }

    // Rule 7: Deleting removes the file from disk in the same operation
    if (product.fileKey) {
      await this.storage.delete(product.fileKey).catch(() => {});
    }

    await this.repo.delete(id);
    return { message: "Upload deleted successfully" };
  }
}

export const uploadsService = new UploadsService();
