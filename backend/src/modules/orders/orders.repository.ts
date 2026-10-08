import { prisma } from '../../config/database';

export class OrdersRepository {
  /**
   * Find orders placed by a buyer (their purchases)
   */
  async findBuyerOrders(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            category: true,
            price: true,
          },
        },
      },
    });
  }

  /**
   * Find sales for a seller's products
   */
  async findSellerSales(sellerId: string) {
    return prisma.order.findMany({
      where: {
        product: {
          sellerId,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            nameAr: true,
          },
        },
      },
    });
  }
}

export const ordersRepository = new OrdersRepository();
