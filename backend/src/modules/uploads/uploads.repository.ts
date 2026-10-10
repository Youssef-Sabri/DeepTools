import { prisma } from "../../config/database";
import { Product } from "@prisma/client";

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
    status: string;
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
      where: { id },
    });
  }

  async findBySeller(
    sellerId: string,
    params: {
      status?: string;
      skip: number;
      take: number;
    },
  ): Promise<Product[]> {
    return prisma.product.findMany({
      where: {
        sellerId,
        ...(params.status ? { status: params.status } : {}),
      },
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: "desc" },
    });
  }

  async countBySeller(sellerId: string, status?: string): Promise<number> {
    return prisma.product.count({
      where: {
        sellerId,
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
      status: string;
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
    await prisma.product.delete({
      where: { id },
    });
  }
}

export const uploadsRepository = new UploadsRepository();
