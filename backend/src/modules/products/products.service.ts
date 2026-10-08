import crypto from 'crypto';
import { productsRepository, ProductsRepository } from './products.repository';
import { NotFoundError } from '../../utils/apiError';
import {
  CreateProductInput,
  UpdateProductInput,
  ListPublicProductsQuery,
} from './products.validator';
import { Product } from '@prisma/client';

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
  constructor(private readonly repo: ProductsRepository = productsRepository) {}

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
    const isAr = lang?.toLowerCase().startsWith('ar');
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
      sellerName: p.seller?.name || 'Verified Seller',
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
      status: 'approved',
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
    status: string = 'approved',
  ): Promise<PublicProduct> {
    const product = await this.repo.findById(id, status);
    if (!product) {
      throw new NotFoundError('Product not found');
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
      status: 'approved',
    });
  }

  async update(id: string, data: UpdateProductInput) {
    const existing = await this.repo.findById(id, '');
    if (!existing) {
      throw new NotFoundError('Product not found');
    }
    return this.repo.update(id, data);
  }

  async remove(id: string) {
    const existing = await this.repo.findById(id, '');
    if (!existing) {
      throw new NotFoundError('Product not found');
    }
    await this.repo.delete(id);
    return { message: 'Product deleted successfully' };
  }

  async purchase(userId: string, productId: string) {
    const product = await this.findOne(productId);

    const licenseKey = `DF-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    // Rule 7.1-7.4: Server-calculated integer commission & order snapshot in single transaction
    const commissionPercent = 10;
    const commissionAmount = Math.round(
      (product.price * commissionPercent) / 100,
    );
    const sellerAmount = product.price - commissionAmount;

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
      message: 'Purchase completed successfully',
      product,
      license,
      order,
    };
  }

  async findUserLicenses(userId: string) {
    return this.repo.findUserLicenses(userId);
  }
}

export const productsService = new ProductsService();
