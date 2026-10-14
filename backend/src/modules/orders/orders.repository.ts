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
            select: {
              id: true,
              name: true,
              nameAr: true,
              category: true,
              price: true,
            },
          },
        },
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    return { items, total, page, limit };
  }

  async findSellerSales(
    sellerId: string,
    page: number = 1,
    limit: number = 20,
  ) {
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

  async getSellerTotals(
    sellerId: string,
  ): Promise<{ gross: number; earnings: number }> {
    const result = await prisma.order.aggregate({
      _sum: { amount: true, sellerAmount: true },
      where: {
        status: OrderStatus.COMPLETED,
        sellerId,
      },
    });

    return {
      gross: result._sum.amount || 0,
      earnings: result._sum.sellerAmount || 0,
    };
  }

  async findApprovedProduct(productId: string) {
    return prisma.product.findFirst({
      where: {
        id: productId,
        status: "APPROVED",
        deletedAt: null,
      },
    });
  }

  async findExistingLicense(productId: string, buyerEmail: string) {
    return prisma.license.findFirst({
      where: {
        productId,
        buyerEmail,
        isActive: true,
      },
    });
  }

  async createGuestOrderAndLicense(params: {
    productId: string;
    productName: string;
    sellerId: string;
    fileKey: string | null;
    fileMime: string | null;
    amount: number;
    commissionPercent: number;
    commissionAmount: number;
    sellerAmount: number;
    buyerEmail: string;
    buyerName?: string;
    licenseKey: string;
    guestAccessToken: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          productId: params.productId,
          productName: params.productName,
          sellerId: params.sellerId,
          buyerEmail: params.buyerEmail,
          buyerName: params.buyerName,
          fileKey: params.fileKey,
          fileMime: params.fileMime,
          currency: "USD",
          amount: params.amount,
          commissionPercent: params.commissionPercent,
          commissionAmount: params.commissionAmount,
          sellerAmount: params.sellerAmount,
          status: OrderStatus.COMPLETED,
          paymentGateway: "simulated",
        },
      });

      const license = await tx.license.create({
        data: {
          productId: params.productId,
          buyerEmail: params.buyerEmail,
          licenseKey: params.licenseKey,
          guestAccessToken: params.guestAccessToken,
          fileKey: params.fileKey,
          fileMime: params.fileMime,
          isActive: true,
        },
      });

      await tx.paymentEvent.create({
        data: {
          gateway: "simulated",
          eventId: `sim_guest_${order.id}`,
          orderId: order.id,
        },
      });

      return { order, license };
    });
  }

  async countCompletedOrdersByEmail(email: string): Promise<number> {
    return prisma.order.count({
      where: {
        buyerEmail: email,
        status: OrderStatus.COMPLETED,
      },
    });
  }

  async createMagicLinkToken(
    email: string,
    tokenHash: string,
    expiresAt: Date,
  ) {
    return prisma.guestMagicLinkToken.create({
      data: {
        email,
        tokenHash,
        expiresAt,
        isUsed: false,
      },
    });
  }

  async findMagicLinkToken(tokenHash: string) {
    return prisma.guestMagicLinkToken.findUnique({
      where: { tokenHash },
    });
  }

  async markMagicLinkTokenUsed(id: string) {
    return prisma.guestMagicLinkToken.update({
      where: { id },
      data: { isUsed: true },
    });
  }

  async findLicensesByEmail(email: string) {
    return prisma.license.findMany({
      where: {
        buyerEmail: email,
        isActive: true,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            category: true,
            price: true,
            version: true,
            fileKey: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

export const ordersRepository = new OrdersRepository();
