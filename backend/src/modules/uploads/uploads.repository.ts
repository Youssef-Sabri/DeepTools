import { prisma } from "../../config/database";
import { Product, ProductStatus } from "@prisma/client";

export class UploadsRepository {
  async create(data: {
    sellerId: string;
    name: string;
    nameAr?: string | null;
    description: string;
    descriptionAr?: string | null;
    category: string;
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
        deletedAt: null
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

  async countBySeller(sellerId: string, status?: ProductStatus): Promise<number> {
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
    data: Partial<{
      name: string;
      nameAr?: string | null;
      description: string;
      descriptionAr?: string | null;
      category: string;
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
  ): Promise<Product> {
    return prisma.product.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }
}

export const uploadsRepository = new UploadsRepository();