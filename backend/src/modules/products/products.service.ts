import crypto from "crypto";
import fs from "fs";
import path from "path";
import { Response } from "express";
import { productsRepository, ProductsRepository } from "./products.repository";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  InternalServerError,
} from "../../utils/apiError";
import { splitCommission } from "../../utils/commission";
import { settingsService, SettingsService } from "../settings/settings.service";
import {
  storageService,
  LocalStorageService,
} from "../../storage/storage.service";
import {
  CreateProductInput,
  UpdateProductInput,
  ListPublicProductsQuery,
} from "./products.validator";
import { Product } from "@prisma/client";

export type ProductWithSeller = Product & {
  seller?: { id: string; name: string } | null;
};

export interface PublicProduct {
  id: string;
  name: string;
  nameAr: string | null;
  description: string;
  descriptionAr: string | null;
  category: string;
  price: number;
  version: string;
  badge: string | null;
  badgeAr: string | null;
  downloadUrl?: string | null;
  displayName: string;
  displayDescription: string;
  displayBadge: string | null;
  sellerId: string;
  sellerName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedPublicProducts {
  items: PublicProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ProductsService {
  constructor(
    private readonly repo: ProductsRepository = productsRepository,
    private readonly settings: SettingsService = settingsService,
    private readonly storage: LocalStorageService = storageService,
  ) {}

  /**
   * Format product for public consumption:
   * - Localizes text based on lang (en or ar)
   * - Strips private fileKey and internal fields
   * - Exposes seller as { sellerId, sellerName }
   */
  private formatPublicProduct(
    p: ProductWithSeller,
    lang?: string,
  ): PublicProduct {
    const isAr = lang?.toLowerCase().startsWith("ar");
    return {
      id: p.id,
      name: p.name,
      nameAr: p.nameAr,
      description: p.description,
      descriptionAr: p.descriptionAr,
      category: p.category,
      price: p.price,
      version: p.version,
      badge: p.badge,
      badgeAr: p.badgeAr,
      downloadUrl: p.downloadUrl,
      displayName: isAr && p.nameAr ? p.nameAr : p.name,
      displayDescription:
        isAr && p.descriptionAr ? p.descriptionAr : p.description,
      displayBadge: isAr && p.badgeAr ? p.badgeAr : p.badge,
      sellerId: p.sellerId,
      sellerName: p.seller?.name || "Verified Seller",
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  /**
   * List approved products with pagination, search, category filtering, and localization.
   */
  async findAll(
    query: ListPublicProductsQuery = { page: 1, limit: 20 },
  ): Promise<PaginatedPublicProducts> {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const { items, total } = await this.repo.findAll({
      page,
      limit,
      category: query.category,
      search: query.search,
      status: "approved",
    });

    return {
      items: items.map((p) => this.formatPublicProduct(p, query.lang)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieve a single approved product by ID.
   * Unapproved products return 404.
   */
  async findOne(
    id: string,
    lang?: string,
    status: string = "approved",
  ): Promise<PublicProduct> {
    const product = await this.repo.findById(id, status);
    if (!product) {
      throw new NotFoundError("Product not found");
    }
    return this.formatPublicProduct(product, lang);
  }

  async create(data: CreateProductInput, sellerId: string) {
    return this.repo.create({
      ...data,
      sellerId,
      nameAr: data.nameAr ?? null,
      descriptionAr: data.descriptionAr ?? null,
      badge: data.badge ?? null,
      badgeAr: data.badgeAr ?? null,
      status: "approved",
    });
  }

  async update(id: string, data: UpdateProductInput) {
    const existing = await this.repo.findById(id, "");
    if (!existing) {
      throw new NotFoundError("Product not found");
    }
    return this.repo.update(id, data);
  }

  async remove(id: string) {
    const existing = await this.repo.findById(id, "");
    if (!existing) {
      throw new NotFoundError("Product not found");
    }
    await this.repo.delete(id);
    return { message: "Product deleted successfully" };
  }

  /**
   * Purchase product:
   * Rule 1: Product status must be 'approved' -> 404
   * Rule 2: req.user.id cannot equal product.sellerId -> 403
   * Rule 3: Existing license for (userId, productId) -> 409
   * Rule 4: req.user.role === 'admin' cannot purchase -> 403
   * Rule 5: Price always from DB
   * Rule 6: Commission fetched from settings.service
   * Rule 7: Single prisma.$transaction: create License + create Order
   */
  async purchase(userId: string, userRole: string, productId: string) {
    if (userRole === "admin") {
      throw new ForbiddenError("Admins cannot purchase marketplace products");
    }

    const product = await this.repo.findById(productId, "approved");
    if (!product) {
      throw new NotFoundError("Product not found");
    }

    if (product.sellerId === userId) {
      throw new ForbiddenError("You cannot purchase your own product");
    }

    const existingLicense = await this.repo.findLicense(userId, productId);
    if (existingLicense) {
      throw new ConflictError(
        "You already own an active license for this product",
      );
    }

    const commissionPercent = await this.settings.getCommissionPercent();
    const { commissionAmount, sellerAmount } = splitCommission(
      product.price,
      commissionPercent,
    );

    const licenseKey = `DF-${crypto.randomBytes(4).toString("hex").toUpperCase()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    const { license, order } = await this.repo.createPurchaseTransaction({
      userId,
      productId,
      licenseKey,
      expiresAt,
      amount: product.price,
      commissionPercent,
      commissionAmount,
      sellerAmount,
    });

    return {
      message: "Purchase completed successfully",
      product: this.formatPublicProduct(product),
      license,
      order,
    };
  }

  /**
   * Stream download for purchased product:
   * Rule 1: License for (userId, productId) must exist -> 403
   * Rule 2: license.isActive must be true -> 403
   * Rule 3: Stream via storage.service.stream()
   * Rule 4: Headers: Content-Disposition attachment; filename="<product.name>.<ext>", Content-Type
   * Rule 5: Missing file on disk -> log full error, return 500
   */
  async downloadProduct(
    userId: string,
    productId: string,
    res: Response,
  ): Promise<void> {
    const license = await this.repo.findLicense(userId, productId);
    if (!license) {
      throw new ForbiddenError(
        "You do not have a license to download this product",
      );
    }

    if (!license.isActive) {
      throw new ForbiddenError("License is inactive or revoked");
    }

    const product = await this.repo.findById(productId, "");
    if (!product || !product.fileKey) {
      console.error(
        `[DownloadError] Product ${productId} has no associated fileKey`,
      );
      throw new InternalServerError("File storage error: file missing on disk");
    }

    try {
      const resolvedPath = this.storage.resolveKeyPath(product.fileKey);
      await fs.promises.access(resolvedPath, fs.constants.R_OK);
    } catch (err) {
      console.error(
        `[DownloadError] Product ${productId} references missing file ${product.fileKey} on disk:`,
        err,
      );
      throw new InternalServerError("File storage error: file missing on disk");
    }

    const ext = path.extname(product.fileKey) || "";
    const safeName = product.name.replace(/[^a-zA-Z0-9_\-.]/g, "_");
    const filename = `${safeName}${ext}`;

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader(
      "Content-Type",
      product.fileMime || "application/octet-stream",
    );

    await this.storage.stream(product.fileKey, res);
  }

  async findUserLicenses(userId: string) {
    return this.repo.findUserLicenses(userId);
  }
}

export const productsService = new ProductsService();
