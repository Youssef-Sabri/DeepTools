import { prisma } from "../../config/database";
import { OrderStatus } from "@prisma/client";

export class OrdersRepository {
  async findBuyerOrders(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            select: { id: true, name: true, nameAr: true, category: true, price: true },
          },
        },
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    return { items, total, page, limit };
  }

  async findSellerSales(sellerId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const whereCondition = {
      status: OrderStatus.COMPLETED,
      sellerId,
    };

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            select: { id: true, name: true, nameAr: true },
          },
        },
      }),
      prisma.order.count({ where: whereCondition }),
    ]);

    return { items, total, page, limit };
  }

  async getSellerTotalEarnings(sellerId: string): Promise<number> {
    const result = await prisma.order.aggregate({
      _sum: { sellerAmount: true },
      where: {
        status: OrderStatus.COMPLETED,
        sellerId,
      },
    });

    return result._sum.sellerAmount || 0;
  }
}

export const ordersRepository = new OrdersRepository();
