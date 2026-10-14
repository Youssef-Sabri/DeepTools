import path from "path";
import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { OrdersRepository, ordersRepository } from "./orders.repository";
import { ListOrdersQuery, GuestPurchaseInput } from "./orders.validator";
import { settingsService } from "../settings/settings.service";
import { splitCommission } from "../../utils/commission";
import { ApiError } from "../../utils/apiError";
import { emailService } from "../../services/email.service";

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
  totalGrossSales: number;
  page: number;
  totalPages: number;
}

export class OrdersService {
  constructor(
    private readonly ordersRepo: OrdersRepository = ordersRepository,
  ) {}

  async getMyPurchases(userId: string, query: ListOrdersQuery) {
    const { items, total, page, limit } = await this.ordersRepo.findBuyerOrders(
      userId,
      query.page,
      query.limit,
    );

    return {
      orders: items.map((o) => ({
        id: o.id,
        productId: o.productId,
        productName: o.productName,
        fileExtension: path.extname(o.fileKey ?? "").toLowerCase() || null,
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

  async getSellerSales(
    sellerId: string,
    query: ListOrdersQuery,
  ): Promise<SellerSalesResponse> {
    const [salesData, totals] = await Promise.all([
      this.ordersRepo.findSellerSales(sellerId, query.page, query.limit),
      this.ordersRepo.getSellerTotals(sellerId),
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
      totalSellerEarnings: totals.earnings,
      totalGrossSales: totals.gross,
      page: salesData.page,
      totalPages: Math.ceil(salesData.total / salesData.limit) || 1,
    };
  }

  async purchaseAsGuest(input: GuestPurchaseInput, currentUserId?: string) {
    const buyerEmail = input.buyerEmail.toLowerCase().trim();

    const product = await this.ordersRepo.findApprovedProduct(input.productId);
    if (!product) {
      throw ApiError.badRequest(
        "Product not found or not approved for purchase",
      );
    }

    if (currentUserId && currentUserId === product.sellerId) {
      throw ApiError.forbidden("You cannot purchase your own product");
    }

    // Duplicate purchase guard
    const existingLicense = await this.ordersRepo.findExistingLicense(
      input.productId,
      buyerEmail,
    );
    if (existingLicense) {
      throw ApiError.conflict(
        "This email has already purchased this item. Please use the Purchases Lookup page to access your file.",
      );
    }

    const commissionPercent = await settingsService.getCommissionPercent();
    const { commissionAmount, sellerAmount } = splitCommission(
      product.price,
      commissionPercent,
    );

    const guestAccessToken = "gdt_" + crypto.randomBytes(24).toString("hex");
    const rawLicenseHex = crypto.randomBytes(8).toString("hex").toUpperCase();
    const licenseKey = `DT-${rawLicenseHex.slice(0, 4)}-${rawLicenseHex.slice(4, 8)}-${rawLicenseHex.slice(8, 12)}-${rawLicenseHex.slice(12, 16)}`;

    const { order, license } = await this.ordersRepo
      .createGuestOrderAndLicense({
        productId: product.id,
        productName: product.name,
        sellerId: product.sellerId,
        fileKey: product.approvedFileKey,
        fileMime: product.approvedFileMime,
        amount: product.price,
        commissionPercent,
        commissionAmount,
        sellerAmount,
        buyerEmail,
        buyerName: input.buyerName,
        licenseKey,
        guestAccessToken,
      })
      .catch((error: unknown) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          throw ApiError.conflict(
            "This email has already purchased this item. Please use the Purchases Lookup page to access your file.",
          );
        }
        throw error;
      });

    const downloadUrl = `/api/v1/products/${product.id}/download?token=${guestAccessToken}`;

    // Automatically dispatch a secure magic access link to buyer's email
    this.requestGuestAccess(buyerEmail).catch((err) => {
      console.warn("Could not dispatch guest purchase email:", err);
    });

    return {
      order: {
        id: order.id,
        amount: order.amount,
        status: order.status,
        productName: order.productName,
        createdAt: order.createdAt,
      },
      license: {
        id: license.id,
        licenseKey: license.licenseKey,
      },
      downloadToken: guestAccessToken,
      downloadUrl,
    };
  }

  async requestGuestAccess(email: string, baseUrl?: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const completedCount =
      await this.ordersRepo.countCompletedOrdersByEmail(normalizedEmail);

    if (completedCount > 0) {
      const rawToken = "gml_" + crypto.randomBytes(24).toString("hex");
      const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");
      // Permanent lifetime access link (never expires)
      const expiresAt = new Date("9999-12-31T23:59:59.999Z");

      await this.ordersRepo.createMagicLinkToken(
        normalizedEmail,
        tokenHash,
        expiresAt,
      );

      const frontendUrl =
        baseUrl || process.env.FRONTEND_URL || "http://localhost:3000";
      const magicLinkUrl = `${frontendUrl}/guest/purchases?token=${rawToken}`;

      await emailService.sendMagicLink({
        email: normalizedEmail,
        magicLinkUrl,
      });
    }

    // Always return generic response to prevent email sniffing and file theft
    return {
      success: true,
      message:
        "If there are purchases associated with this email, we have sent a secure access link to your inbox.",
    };
  }

  async verifyGuestAccess(rawToken: string) {
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const record = await this.ordersRepo.findMagicLinkToken(tokenHash);

    if (!record || record.expiresAt < new Date()) {
      throw ApiError.unauthorized(
        "Access link is invalid or has expired. Please request a new one.",
      );
    }

    // `isUsed` is recorded but NOT enforced: guest links stay reusable
    // indefinitely (BACKEND_RULES.md 5.13). Contrast passwordResetToken,
    // where it is enforced as single-use.
    if (!record.isUsed) {
      await this.ordersRepo.markMagicLinkTokenUsed(record.id);
    }

    const licenses = await this.ordersRepo.findLicensesByEmail(record.email);
    const sessionExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

    return {
      email: record.email,
      sessionExpiresAt,
      purchases: licenses.map((l) => ({
        id: l.id,
        productId: l.productId,
        productName: l.product?.name ?? "Unknown Product",
        productNameAr: l.product?.nameAr ?? null,
        category: l.product?.category,
        licenseKey: l.licenseKey,
        createdAt: l.createdAt,
        downloadUrl: `/api/v1/products/${l.productId}/download`,
      })),
    };
  }

  async getGuestPurchases(email: string) {
    const licenses = await this.ordersRepo.findLicensesByEmail(email);

    return {
      email,
      purchases: licenses.map((l) => ({
        id: l.id,
        productId: l.productId,
        productName: l.product?.name ?? "Unknown Product",
        productNameAr: l.product?.nameAr ?? null,
        category: l.product?.category,
        licenseKey: l.licenseKey,
        createdAt: l.createdAt,
        downloadUrl: `/api/v1/products/${l.productId}/download`,
      })),
    };
  }
}

export const ordersService = new OrdersService();
