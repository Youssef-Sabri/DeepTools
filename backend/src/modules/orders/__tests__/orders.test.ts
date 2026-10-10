import request from "supertest";
import { createApp } from "../../../app";
import { prisma } from "../../../config/database";
import {
  mockUser,
  mockBuyer,
  mockAdmin,
  createToken,
} from "../../../test/test-helpers";

jest.mock("../../../config/database", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    order: {
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    product: {
      count: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe("Orders & Sales & Insights Endpoints (Task B-7)", () => {
  const app = createApp();
  const buyerToken = createToken(mockBuyer);
  const sellerToken = createToken(mockUser);
  const adminToken = createToken(mockAdmin);

  beforeEach(() => {
    jest.clearAllMocks();

    (prisma.user.findUnique as jest.Mock).mockImplementation(({ where }) => {
      if (where.id === mockBuyer.id) return Promise.resolve(mockBuyer);
      if (where.id === mockUser.id) return Promise.resolve(mockUser);
      if (where.id === mockAdmin.id) return Promise.resolve(mockAdmin);
      return Promise.resolve(null);
    });
  });

  describe("GET /api/v1/orders/mine", () => {
    it("returns own purchases for buyer", async () => {
      (prisma.order.findMany as jest.Mock).mockResolvedValue([
        {
          id: "ord-1",
          userId: mockBuyer.id,
          amount: 4900,
          status: "completed",
          paymentGateway: "simulated",
          createdAt: new Date(),
          product: {
            id: "prod-1",
            name: "Automation Bot",
            category: "script",
            price: 4900,
          },
        },
      ]);

      const res = await request(app)
        .get("/api/v1/orders/mine")
        .set("Authorization", `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orders).toHaveLength(1);
      expect(res.body.data.orders[0].product.name).toBe("Automation Bot");
    });
  });

  describe("GET /api/v1/orders/sales", () => {
    it("returns seller sales and accurately computes totalSellerEarnings", async () => {
      (prisma.order.findMany as jest.Mock).mockResolvedValue([
        {
          id: "ord-1",
          productId: "prod-1",
          amount: 4900,
          commissionPercent: 10,
          commissionAmount: 490,
          sellerAmount: 4410,
          createdAt: new Date(),
          product: {
            id: "prod-1",
            name: "Automation Bot",
          },
        },
        {
          id: "ord-2",
          productId: "prod-1",
          amount: 1000,
          commissionPercent: 10,
          commissionAmount: 100,
          sellerAmount: 900,
          createdAt: new Date(),
          product: {
            id: "prod-1",
            name: "Automation Bot",
          },
        },
      ]);

      const res = await request(app)
        .get("/api/v1/orders/sales")
        .set("Authorization", `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sales).toHaveLength(2);
      expect(res.body.data.totalSales).toBe(2);
      expect(res.body.data.totalSellerEarnings).toBe(5310);
    });
  });

  describe("GET /api/v1/admin/insights/marketplace", () => {
    it("returns full marketplace dashboard metrics with all 5 groups", async () => {
      (prisma.product.count as jest.Mock)
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(12) // pending
        .mockResolvedValueOnce(75) // approved
        .mockResolvedValueOnce(13); // rejected

      (prisma.order.aggregate as jest.Mock).mockResolvedValue({
        _sum: {
          amount: 1670000,
          commissionAmount: 167000,
          sellerAmount: 1503000,
        },
      });

      (prisma.order.count as jest.Mock).mockResolvedValue(342);

      (prisma.product.groupBy as jest.Mock).mockResolvedValue(
        Array.from({ length: 28 }, (_, i) => ({ sellerId: `seller-${i}` })),
      );

      (prisma.order.groupBy as jest.Mock).mockResolvedValue([
        { productId: "prod-top-1", _count: { id: 45 } },
        { productId: "prod-top-2", _count: { id: 30 } },
      ]);

      (prisma.product.findMany as jest.Mock).mockResolvedValue([
        { id: "prod-top-1", name: "Top Seller Bot" },
        { id: "prod-top-2", name: "Second Bot" },
      ]);

      const res = await request(app)
        .get("/api/v1/admin/insights/marketplace")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.uploads).toEqual({
        total: 100,
        pending: 12,
        approved: 75,
        rejected: 13,
      });
      expect(res.body.data.orders).toEqual({
        total: 342,
        totalRevenue: 1670000,
        totalCommission: 167000,
        totalSellerPayouts: 1503000,
      });
      expect(res.body.data.sellers.total).toBe(28);
      expect(res.body.data.topProducts).toHaveLength(2);
      expect(res.body.data.topProducts[0].salesCount).toBe(45);
    });

    it("returns 403 when non-admin accesses marketplace insights", async () => {
      const res = await request(app)
        .get("/api/v1/admin/insights/marketplace")
        .set("Authorization", `Bearer ${buyerToken}`);

      expect(res.status).toBe(403);
    });
  });
});
