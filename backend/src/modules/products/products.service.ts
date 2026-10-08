import crypto from 'crypto';
import { productsRepository, ProductsRepository } from './products.repository';
import { NotFoundError } from '../../utils/apiError';
import { CreateProductInput, UpdateProductInput } from './products.validator';
import { Product } from '@prisma/client';

export interface LocalizedProduct extends Product {
  displayName: string;
  displayDescription: string;
  displayBadge: string | null;
}

export class ProductsService {
  constructor(private readonly repo: ProductsRepository = productsRepository) {}

  private formatProduct(p: Product, lang?: string): LocalizedProduct {
    const isAr = lang?.toLowerCase().startsWith('ar');
    return {
      ...p,
      displayName: isAr && p.nameAr ? p.nameAr : p.name,
      displayDescription:
        isAr && p.descriptionAr ? p.descriptionAr : p.description,
      displayBadge: isAr && p.badgeAr ? p.badgeAr : p.badge,
    };
  }

  async findAll(lang?: string): Promise<LocalizedProduct[]> {
    const list = await this.repo.findAll();
    return list.map((p) => this.formatProduct(p, lang));
  }

  async findOne(id: string, lang?: string): Promise<LocalizedProduct> {
    const product = await this.repo.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return this.formatProduct(product, lang);
  }

  async create(data: CreateProductInput) {
    return this.repo.create({
      ...data,
      nameAr: data.nameAr ?? null,
      descriptionAr: data.descriptionAr ?? null,
      badge: data.badge ?? null,
      badgeAr: data.badgeAr ?? null,
    });
  }

  async update(id: string, data: UpdateProductInput) {
    await this.findOne(id);
    return this.repo.update(id, data);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repo.delete(id);
    return { message: 'Product deleted successfully' };
  }

  async purchase(userId: string, productId: string) {
    const product = await this.findOne(productId);

    const licenseKey = `DF-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const newLicense = await this.repo.createLicense({
      userId,
      productId,
      licenseKey,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    return {
      message: 'Purchase completed successfully',
      product,
      license: newLicense,
    };
  }

  async findUserLicenses(userId: string) {
    return this.repo.findUserLicenses(userId);
  }
}

export const productsService = new ProductsService();
