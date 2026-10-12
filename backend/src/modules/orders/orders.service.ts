import { OrdersRepository, ordersRepository } from "./orders.repository";
import { ListOrdersQuery } from "./orders.validator";

export interface SellerSaleItem {
  orderId: string;
  productId: string;
  productName: string;
  productNameAr?: string | null;
  amount: number;
  commissionPercent: number;
  commissionAmount: number;
  sellerAmount: number;
  createdAt: Date;
}

export interface SellerSalesResponse {
  sales: SellerSaleItem[];
  totalSales: number;
  totalSellerEarnings: number;
  page: number;
  totalPages: number;
}

export class OrdersService {
  constructor(
    private readonly ordersRepo: OrdersRepository = ordersRepository,
  ) { }

  async getMyPurchases(userId: string, query: ListOrdersQuery) {
    const { items, total, page, limit } = await this.ordersRepo.findBuyerOrders(
      userId,
      query.page,
      query.limit
    );

    return {
      orders: items.map((o) => ({
        id: o.id,
        amount: o.amount,
        status: o.status,
        paymentGateway: o.paymentGateway,
        createdAt: o.createdAt,
        product: o.product,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getSellerSales(sellerId: string, query: ListOrdersQuery): Promise<SellerSalesResponse> {
    const [salesData, totalSellerEarnings] = await Promise.all([
      this.ordersRepo.findSellerSales(sellerId, query.page, query.limit),
      this.ordersRepo.getSellerTotalEarnings(sellerId) 
    ]);

    const sales: SellerSaleItem[] = salesData.items.map((o) => ({
      orderId: o.id,
      productId: o.productId ?? "",
      productName: o.productName ?? o.product?.name ?? "Unknown Product",
      productNameAr: o.product?.nameAr ?? null,
      amount: o.amount,
      commissionPercent: o.commissionPercent,
      commissionAmount: o.commissionAmount,
      sellerAmount: o.sellerAmount,
      createdAt: o.createdAt,
    }));

    return {
      sales,
      totalSales: salesData.total,
      totalSellerEarnings,
      page: salesData.page,
      totalPages: Math.ceil(salesData.total / salesData.limit) || 1,
    };
  }
}

export const ordersService = new OrdersService();
