import request from "supertest";
import { createApp } from "../../../app";
import { prisma } from "../../../config/database";
import { storageService } from "../../../storage/storage.service";
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
      findMany: jest.fn(),
      count: jest.fn(),
    },
    license: {
      findFirst: jest.fn(),
    },
    order: { findUnique: jest.fn() },
    setting: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock("../../../storage/storage.service", () => ({
  storageService: { stat: jest.fn() },
}));

describe("Product Purchase Endpoints (Task B-6)", () => {
  const app = createApp();
  const buyerToken = createToken(mockBuyer);
  const sellerToken = createToken(mockUser);
  const adminToken = createToken(mockAdmin);

  it("lists only approved products in the public catalog", async () => {
    (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.product.count as jest.Mock).mockResolvedValue(0);
    const res = await request(app).get("/api/v1/products?sort=priceAsc");
    expect(res.status).toBe(200);
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "APPROVED",
          deletedAt: null,
          approvedFileKey: { not: null },
        }),
        orderBy: [{ price: "asc" }, { id: "asc" }],
      }),
    );
  });

  it("rejects invalid UUIDs and excessive catalog searches before database access", async () => {
    expect((await request(app).get("/api/v1/products/not-a-uuid")).status).toBe(
      422,
    );
    expect((await request(app).get("/api/v1/products?page=201")).status).toBe(
      422,
    );
    expect(
      (await request(app).get("/api/v1/products?page=102&limit=100")).status,
    ).toBe(422);
    expect(
      (await request(app).get(`/api/v1/products?search=${"a".repeat(101)}`))
        .status,
    ).toBe(422);
    expect(
      (
        await request(app).get(
          "/api/v1/products/10000000-0000-4000-8000-000000000100?lang=xx",
        )
      ).status,
    ).toBe(422);
    expect(prisma.product.findFirst).not.toHaveBeenCalled();
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  const approvedProduct = {
    id: "10000000-0000-4000-8000-000000000100",
    sellerId: mockUser.id,
    name: "Enterprise Workflow Engine",
    description: "Production-ready workflow engine",
    category: "workflow",
    price: 4900,
    version: "1.0.0",
    status: "APPROVED",
    fileKey: "uploads/file-100.zip",
    approvedFileKey: "uploads/file-100.zip",
    fileSize: 2048,
    fileMime: "application/zip",
    seller: {
      id: mockUser.id,
      name: mockUser.name,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (storageService.stat as jest.Mock).mockResolvedValue({
      size: 2048,
      mimeType: "application/zip",
    });

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

  it("returns the real seller and approved file metadata on the public detail endpoint", async () => {
    (prisma.product.findFirst as jest.Mock).mockResolvedValue({
      ...approvedProduct,
      fileKey: "uploads/unreviewed-replacement.zip",
      approvedFileKey: "uploads/approved-workflow.json",
      fileSize: 3798,
      reviewedAt: new Date("2026-10-08T10:00:00.000Z"),
    });

    const res = await request(app).get(
      `/api/v1/products/${approvedProduct.id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      sellerName: mockUser.name,
      fileSize: 3798,
      fileExtension: ".json",
      publishedAt: "2026-10-08T10:00:00.000Z",
    });
    expect(res.body.data).not.toHaveProperty("fileKey");
    expect(res.body.data).not.toHaveProperty("approvedFileKey");
  });

  it("creates only a pending order and no license", async () => {
    (prisma.product.findFirst as jest.Mock).mockResolvedValue(approvedProduct);
    (prisma.license.findFirst as jest.Mock).mockResolvedValue(null);

    const createdOrder = {
      id: "ord-1",
      userId: mockBuyer.id,
      productId: approvedProduct.id,
      amount: 4900,
      commissionPercent: 10,
      commissionAmount: 490,
      sellerAmount: 4410,
      status: "PENDING",
      paymentGateway: "unconfigured",
    };

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      const tx = {
        product: { findFirst: jest.fn().mockResolvedValue(approvedProduct) },
        order: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue(createdOrder),
        },
      };
      return callback(tx);
    });

    const res = await request(app)
      .post(`/api/v1/products/${approvedProduct.id}/purchase`)
      .set("Authorization", `Bearer ${buyerToken}`);

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.data.order.amount).toBe(4900);
    expect(res.body.data.order.commissionAmount).toBe(490);
    expect(res.body.data.order.sellerAmount).toBe(4410);
    expect(
      res.body.data.order.commissionAmount + res.body.data.order.sellerAmount,
    ).toBe(res.body.data.order.amount);
    expect(res.body.data.order.paymentGateway).toBe("unconfigured");
    expect(res.body.data.order.status).toBe("PENDING");
    expect(res.body.data).not.toHaveProperty("license");
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
    expect(res.body.message).toMatch(/already own a license/i);
  });

  it("returns 404 when attempting to buy unapproved or non-existent product", async () => {
    (prisma.product.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post("/api/v1/products/10000000-0000-4000-8000-000000000101/purchase")
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
