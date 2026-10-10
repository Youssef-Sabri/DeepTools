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
    product: {
      findFirst: jest.fn(),
    },
    license: {
      findFirst: jest.fn(),
    },
    setting: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe("Product Purchase Endpoints (Task B-6)", () => {
  const app = createApp();
  const buyerToken = createToken(mockBuyer);
  const sellerToken = createToken(mockUser);
  const adminToken = createToken(mockAdmin);

  const approvedProduct = {
    id: "prod-100",
    sellerId: mockUser.id,
    name: "Enterprise Workflow Engine",
    description: "Production-ready workflow engine",
    category: "workflow",
    price: 4900,
    version: "1.0.0",
    status: "approved",
    fileKey: "uploads/file-100.zip",
    fileSize: 2048,
    fileMime: "application/zip",
    seller: {
      id: mockUser.id,
      name: mockUser.name,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (prisma.user.findUnique as jest.Mock).mockImplementation(({ where }) => {
      if (where.id === mockBuyer.id) return Promise.resolve(mockBuyer);
      if (where.id === mockUser.id) return Promise.resolve(mockUser);
      if (where.id === mockAdmin.id) return Promise.resolve(mockAdmin);
      return Promise.resolve(null);
    });

    // Default commission setting (10%)
    (prisma.setting.findUnique as jest.Mock).mockResolvedValue({
      id: "set-1",
      key: "commission_percent",
      value: "10",
    });
  });

  it("successful purchase -> order snapshot is correct", async () => {
    (prisma.product.findFirst as jest.Mock).mockResolvedValue(approvedProduct);
    (prisma.license.findFirst as jest.Mock).mockResolvedValue(null);

    const createdLicense = {
      id: "lic-1",
      userId: mockBuyer.id,
      productId: approvedProduct.id,
      licenseKey: "DF-TEST-1234-5678",
      expiresAt: new Date(),
    };
    const createdOrder = {
      id: "ord-1",
      userId: mockBuyer.id,
      productId: approvedProduct.id,
      amount: 4900,
      commissionPercent: 10,
      commissionAmount: 490,
      sellerAmount: 4410,
      status: "completed",
      paymentGateway: "simulated",
    };

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      const tx = {
        license: { create: jest.fn().mockResolvedValue(createdLicense) },
        order: { create: jest.fn().mockResolvedValue(createdOrder) },
      };
      return callback(tx);
    });

    const res = await request(app)
      .post(`/api/v1/products/${approvedProduct.id}/purchase`)
      .set("Authorization", `Bearer ${buyerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.order.amount).toBe(4900);
    expect(res.body.data.order.commissionAmount).toBe(490);
    expect(res.body.data.order.sellerAmount).toBe(4410);
    expect(
      res.body.data.order.commissionAmount + res.body.data.order.sellerAmount,
    ).toBe(res.body.data.order.amount);
    expect(res.body.data.order.paymentGateway).toBe("simulated");
    expect(res.body.data.product).not.toHaveProperty("fileKey");
  });

  it("returns 403 when user attempts to buy own product", async () => {
    (prisma.product.findFirst as jest.Mock).mockResolvedValue(approvedProduct);

    const res = await request(app)
      .post(`/api/v1/products/${approvedProduct.id}/purchase`)
      .set("Authorization", `Bearer ${sellerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/cannot purchase your own product/i);
  });

  it("returns 409 when user attempts to buy same product twice", async () => {
    (prisma.product.findFirst as jest.Mock).mockResolvedValue(approvedProduct);
    (prisma.license.findFirst as jest.Mock).mockResolvedValue({
      id: "existing-lic",
      userId: mockBuyer.id,
      productId: approvedProduct.id,
    });

    const res = await request(app)
      .post(`/api/v1/products/${approvedProduct.id}/purchase`)
      .set("Authorization", `Bearer ${buyerToken}`);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already own an active license/i);
  });

  it("returns 404 when attempting to buy unapproved or non-existent product", async () => {
    (prisma.product.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post("/api/v1/products/prod-pending/purchase")
      .set("Authorization", `Bearer ${buyerToken}`);

    expect(res.status).toBe(404);
  });

  it("returns 403 when an admin attempts to purchase", async () => {
    const res = await request(app)
      .post(`/api/v1/products/${approvedProduct.id}/purchase`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/admins cannot purchase/i);
  });
});
