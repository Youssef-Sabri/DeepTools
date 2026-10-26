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
import { Product, ProductStatus, Role } from "@prisma/client";
import { env } from "../../config/env";
import { resolveLocalizedField } from "../../utils/localization";

export type ProductWithSeller = Product & {
  seller?: { id: string; name: string } | null;
  categoryRel?: {
    id: string;
    slug: string;
    name: string;
    nameAr: string;
  } | null;
};

export interface PublicProduct {
  id: string;
  name: string;
  nameAr: string | null;
  description: string;
  descriptionAr: string | null;
  category: string;
  categoryId?: string | null;
  categoryDetails?: {
    id: string;
    slug: string;
    name: string;
    nameAr: string;
    displayName: string;
  } | null;
  price: number;
  version: string;
  badge: string | null;
  badgeAr: string | null;
  displayName: string;
  displayDescription: string;
  displayBadge: string | null;
  sellerId: string;
  sellerName: string | null;
  fileSize: number | null;
  fileExtension: string | null;
  publishedAt: Date | null;
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

  private formatPublicProduct(
    p: ProductWithSeller,
    lang?: string,
  ): PublicProduct {
    return {
      id: p.id,
      name: p.name,
      nameAr: p.nameAr,
      description: p.description,
      descriptionAr: p.descriptionAr,
      category: p.categoryRel?.slug ?? p.category ?? "",
      categoryId: p.categoryId ?? p.categoryRel?.id ?? null,
      categoryDetails: p.categoryRel
        ? {
            id: p.categoryRel.id,
            slug: p.categoryRel.slug,
            name: p.categoryRel.name,
            nameAr: p.categoryRel.nameAr,
            displayName: resolveLocalizedField(
              p.categoryRel.name,
              p.categoryRel.nameAr,
              lang,
            ),
          }
        : null,
      price: p.price,
      version: p.version,
      badge: p.badge,
      badgeAr: p.badgeAr,
      displayName: resolveLocalizedField(p.name, p.nameAr, lang),
      displayDescription: resolveLocalizedField(
        p.description,
        p.descriptionAr,
        lang,
      ),
      displayBadge: resolveLocalizedField(p.badge, p.badgeAr, lang) || null,
      sellerId: p.sellerId,
      sellerName: p.seller?.name ?? null,
      fileSize: p.fileSize ?? null,
      fileExtension:
        path.extname(p.approvedFileKey ?? "").toLowerCase() || null,
      publishedAt: p.reviewedAt ?? null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  async findAll(
    query: ListPublicProductsQuery = { page: 1, limit: 20, sort: "newest" },
  ): Promise<PaginatedPublicProducts> {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const { items, total } = await this.repo.findAll({
      page,
      limit,
      category: query.category,
      search: query.search,
      sort: query.sort,
      status: ProductStatus.APPROVED,
    });

    return {
      items: items.map((p) => this.formatPublicProduct(p, query.lang)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(
    id: string,
    lang?: string,
    status: ProductStatus = ProductStatus.APPROVED,
  ): Promise<PublicProduct> {
    const product = await this.repo.findById(id, status);
    if (
      !product ||
      (status === ProductStatus.APPROVED && !product.approvedFileKey)
    ) {
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
      status: ProductStatus.PENDING,
    });
  }

  async update(id: string, data: UpdateProductInput) {
    const existing = await this.repo.findById(id, "");
    if (!existing) throw new NotFoundError("Product not found");
    return this.repo.update(id, { ...data, status: ProductStatus.PENDING });
  }

  async remove(id: string) {
    const existing = await this.repo.findById(id, "");
    if (!existing) throw new NotFoundError("Product not found");
    await this.repo.delete(id);
    return { message: "Product deleted successfully" };
  }

  async purchase(userId: string, userRole: string, productId: string) {
    // Enforce role check: admins cannot purchase marketplace items
    if (userRole === Role.ADMIN) {
      throw new ForbiddenError("Admins cannot purchase marketplace products");
    }

    const product = await this.repo.findById(productId, ProductStatus.APPROVED);
    if (!product) throw new NotFoundError("Product not found");

    if (product.sellerId === userId) {
      throw new ForbiddenError("You cannot purchase your own product");
    }

    const existingLicense = await this.repo.findLicense(userId, productId);
    if (existingLicense) {
      throw new ConflictError("You already own a license for this product");
    }

    if (!product.approvedFileKey)
      throw new ConflictError("Product has no approved file");
    try {
      const file = await this.storage.stat(product.approvedFileKey);
      if (product.fileSize !== null && file.size !== product.fileSize)
        throw new Error("File size mismatch");
      if (
        product.approvedFileMime &&
        file.mimeType !== product.approvedFileMime
      )
        throw new Error("File type mismatch");
    } catch {
      throw new ConflictError("Approved product file is unavailable");
    }

    const commissionPercent = await this.settings.getCommissionPercent();
    const order = await this.repo.createPendingOrder({
      userId,
      productId,
      commissionPercent,
      gateway: env.PAYMENT_PROVIDER,
      currency: env.PAYMENT_CURRENCY,
    });
    if (!order) throw new ConflictError("Product is no longer available");

    return {
      message: "Order pending payment verification",
      product: this.formatPublicProduct(product),
      order,
    };
  }

  async downloadProduct(
    userId: string,
    productId: string,
    res: Response,
    headOnly = false,
  ): Promise<void> {
    {
      const ownedProduct = await this.repo.findById(productId, "");
      if (ownedProduct?.sellerId === userId) {
        const ownFileKey = ownedProduct.fileKey;
        if (!ownFileKey)
          throw new InternalServerError("Product file is unavailable");
        try {
          const resolvedPath = this.storage.resolveKeyPath(ownFileKey);
          await fs.promises.access(resolvedPath, fs.constants.R_OK);
        } catch {
          throw new InternalServerError("Product file is unavailable");
        }
        const ext = path.extname(ownFileKey) || "";
        const safeName = ownedProduct.name.replace(/[^a-zA-Z0-9_\-.]/g, "_");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${safeName}${ext}"`,
        );
        res.setHeader(
          "Content-Type",
          ownedProduct.fileMime || "application/octet-stream",
        );
        res.setHeader("Cache-Control", "private, no-store");
        if (headOnly) {
          res.status(200).end();
          return;
        }
        await this.storage.stream(ownFileKey, res);
        return;
      }
    }

    const license = await this.repo.findLicense(userId, productId);

    if (!license) {
      throw new ForbiddenError(
        "You do not have a license to download this product",
      );
    }

    if (!license.isActive) {
      throw new ForbiddenError("License is inactive or revoked");
    }

    if (license.expiresAt && license.expiresAt <= new Date()) {
      throw new ForbiddenError("License has expired");
    }

    const product = license.product;
    const fileKey = license.fileKey ?? product?.approvedFileKey;
    if (!product || !fileKey) {
      throw new InternalServerError("File storage error: file missing on disk");
    }

    try {
      const resolvedPath = this.storage.resolveKeyPath(fileKey);
      await fs.promises.access(resolvedPath, fs.constants.R_OK);
    } catch (err) {
      console.error(
        `[DownloadError] Product ${productId} references a missing file`,
        err,
      );
      throw new InternalServerError("File storage error: file missing on disk");
    }

    const ext = path.extname(fileKey) || "";
    const safeName = product.name.replace(/[^a-zA-Z0-9_\-.]/g, "_");
    const filename = `${safeName}${ext}`;

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader(
      "Content-Type",
      license.fileMime ||
        product.approvedFileMime ||
        "application/octet-stream",
    );
    res.setHeader("Cache-Control", "private, no-store");

    if (headOnly) {
      res.status(200).end();
      return;
    }
    await this.storage.stream(fileKey, res);
  }

  async findUserLicenses(userId: string) {
    return this.repo.findUserLicenses(userId);
  }
}

export const productsService = new ProductsService();
