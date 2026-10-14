import { prisma } from "../../config/database";
import { Product, ProductStatus } from "@prisma/client";

export class UploadsRepository {
  async create(data: {
    sellerId: string;
    name: string;
    nameAr?: string | null;
    nameArNorm?: string | null;
    description: string;
    descriptionAr?: string | null;
    descriptionArNorm?: string | null;
    category?: string | null;
    categoryId?: string | null;
    price: number;
    version?: string;
    status: ProductStatus;
    fileKey: string;
    fileSize: number;
    fileMime: string;
    fileChecksum: string;
  }): Promise<Product> {
    return prisma.product.create({
      data,
    });
  }

  async findById(id: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  async findBySeller(
    sellerId: string,
    params: {
      status?: ProductStatus;
      skip: number;
      take: number;
    },
  ): Promise<Product[]> {
    return prisma.product.findMany({
      where: {
        sellerId,
        deletedAt: null,
        ...(params.status ? { status: params.status } : {}),
      },
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: "desc" },
    });
  }

  async countBySeller(
    sellerId: string,
    status?: ProductStatus,
  ): Promise<number> {
    return prisma.product.count({
      where: {
        sellerId,
        deletedAt: null,
        ...(status ? { status } : {}),
      },
    });
  }

  async update(
    id: string,
    sellerId: string,
    expectedUpdatedAt: Date,
    data: Partial<{
      name: string;
      nameAr?: string | null;
      nameArNorm?: string | null;
      description: string;
      descriptionAr?: string | null;
      descriptionArNorm?: string | null;
      category?: string;
      categoryId?: string | null;
      price: number;
      version?: string;
      status: ProductStatus;
      fileKey?: string | null;
      fileSize?: number | null;
      fileMime?: string | null;
      fileChecksum?: string | null;
      rejectionNote?: string | null;
      reviewedAt?: Date | null;
    }>,
  ): Promise<Product | null> {
    const result = await prisma.product.updateMany({
      where: { id, sellerId, deletedAt: null, updatedAt: expectedUpdatedAt },
      data,
    });
    return result.count === 1
      ? prisma.product.findUnique({ where: { id } })
      : null;
  }

  async delete(
    id: string,
    sellerId: string,
    expectedUpdatedAt: Date,
  ): Promise<boolean> {
    const result = await prisma.product.updateMany({
      where: {
        id,
        sellerId,
        deletedAt: null,
        updatedAt: expectedUpdatedAt,
        status: { not: ProductStatus.APPROVED },
      },
      data: {
        deletedAt: new Date(),
        fileKey: null,
        fileSize: null,
        fileMime: null,
        fileChecksum: null,
      },
    });
    return result.count === 1;
  }

  async isFileReferenced(key: string): Promise<boolean> {
    const [products, licenses, orders] = await Promise.all([
      prisma.product.count({
        where: { OR: [{ fileKey: key }, { approvedFileKey: key }] },
      }),
      prisma.license.count({ where: { fileKey: key } }),
      prisma.order.count({ where: { fileKey: key } }),
    ]);
    return products + licenses + orders > 0;
  }
}

export const uploadsRepository = new UploadsRepository();
