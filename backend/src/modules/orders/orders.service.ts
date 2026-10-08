import { OrdersRepository, ordersRepository } from './orders.repository';

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
}

export class OrdersService {
  constructor(
    private readonly ordersRepo: OrdersRepository = ordersRepository,
  ) {}

  /**
   * Retrieve purchases made by the authenticated user (buyer perspective)
   */
  async getMyPurchases(userId: string) {
    const orders = await this.ordersRepo.findBuyerOrders(userId);
    return {
      orders: orders.map((o) => ({
        id: o.id,
        amount: o.amount,
        status: o.status,
        paymentGateway: o.paymentGateway,
        createdAt: o.createdAt,
        product: o.product,
      })),
      total: orders.length,
    };
  }

  /**
   * Retrieve sales history and net earnings for a seller (seller perspective)
   * Only includes orders where the sold product belongs to sellerId.
   */
  async getSellerSales(sellerId: string): Promise<SellerSalesResponse> {
    const orders = await this.ordersRepo.findSellerSales(sellerId);

    const sales: SellerSaleItem[] = orders.map((o) => ({
      orderId: o.id,
      productId: o.productId ?? '',
      productName: o.product?.name ?? 'Unknown Product',
      productNameAr: o.product?.nameAr ?? null,
      amount: o.amount,
      commissionPercent: o.commissionPercent,
      commissionAmount: o.commissionAmount,
      sellerAmount: o.sellerAmount,
      createdAt: o.createdAt,
    }));

    const totalSellerEarnings = sales.reduce(
      (sum, item) => sum + item.sellerAmount,
      0,
    );

    return {
      sales,
      totalSales: sales.length,
      totalSellerEarnings,
    };
  }
}

export const ordersService = new OrdersService();
