import request from "supertest";
import fs from "fs";
import crypto from "crypto";
import { createApp } from "../../../app";
import { prisma } from "../../../config/database";
import { storageService } from "../../../storage/storage.service";
import { emailService } from "../../../services/email.service";
import { mockUser, createToken } from "../../../test/test-helpers";
import { signGuestSession } from "../../auth/session";

jest.mock("../../../config/database", () => ({
  prisma: {
    $transaction: jest.fn((cb) => cb(prisma)),
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    product: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    order: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    license: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    paymentEvent: {
      create: jest.fn(),
    },
    guestMagicLinkToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    setting: {
      findUnique: jest.fn(),
    },
  },
  __esModule: true,
  default: {
    $transaction: jest.fn((cb) => cb(prisma)),
  },
}));

jest.mock("../../../storage/storage.service", () => ({
  storageService: {
    resolveKeyPath: jest.fn(),
    stream: jest.fn(),
  },
}));

jest.mock("../../../services/email.service", () => ({
  emailService: {
    sendMagicLink: jest.fn().mockResolvedValue(undefined),
  },
}));

describe("Guest Checkout & Returning Access (Phase 2)", () => {
  const app = createApp();

  const approvedProduct = {
    id: "20000000-0000-4000-8000-000000000001",
    name: "n8n Workflow Pro",
    nameAr: "مخطط سير العمل المتقدم",
    price: 4900,
    status: "APPROVED",
    sellerId: mockUser.id,
    approvedFileKey: "uploads/workflow-pro.zip",
    approvedFileMime: "application/zip",
    deletedAt: null,
  };

  const sellerToken = createToken(mockUser);

  beforeEach(() => {
    jest.clearAllMocks();

    (prisma.setting.findUnique as jest.Mock).mockResolvedValue({
      key: "commission_percent",
      value: "10",
    });

    (prisma.user.findUnique as jest.Mock).mockImplementation(({ where }) => {
      if (where.id === mockUser.id) return Promise.resolve(mockUser);
      return Promise.resolve(null);
    });
  });

  describe("POST /api/v1/orders/guest-purchase", () => {
    it("completes simulated guest checkout and issues 7-day session cookie", async () => {
      (prisma.product.findFirst as jest.Mock).mockResolvedValue(
        approvedProduct,
      );
      (prisma.license.findFirst as jest.Mock).mockResolvedValue(null);

      (prisma.order.create as jest.Mock).mockResolvedValue({
        id: "ord-guest-1",
        productId: approvedProduct.id,
        productName: approvedProduct.name,
        amount: 4900,
        status: "COMPLETED",
        createdAt: new Date(),
      });

      (prisma.license.create as jest.Mock).mockResolvedValue({
        id: "lic-guest-1",
        licenseKey: "DT-ABCD-1234-EF56-7890",
        guestAccessToken: "gdt_sampletoken123456789",
      });

      (prisma.paymentEvent.create as jest.Mock).mockResolvedValue({
        id: "pe-guest-1",
      });

      const res = await request(app)
        .post("/api/v1/orders/guest-purchase")
        .send({
          productId: approvedProduct.id,
          buyerEmail: "buyer@example.com",
          buyerName: "John Guest",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order.amount).toBe(4900);
      expect(res.body.data.license.licenseKey).toBeDefined();
      expect(res.body.data.downloadToken).toBeDefined();
      expect(res.body.data.downloadUrl).toContain("/download?token=");

      // Checks 7-day session cookie
      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes("dt_guest_session"))).toBe(
        true,
      );
    });

    it("rejects purchase when product is not found or not approved", async () => {
      (prisma.product.findFirst as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post("/api/v1/orders/guest-purchase")
        .send({
          productId: "20000000-0000-4000-8000-000000000001",
          buyerEmail: "buyer@example.com",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/not approved/i);
    });

    it("rejects duplicate purchase for same email with 409 Conflict", async () => {
      (prisma.product.findFirst as jest.Mock).mockResolvedValue(
        approvedProduct,
      );
      (prisma.license.findFirst as jest.Mock).mockResolvedValue({
        id: "lic-existing",
        isActive: true,
      });

      const res = await request(app)
        .post("/api/v1/orders/guest-purchase")
        .send({
          productId: approvedProduct.id,
          buyerEmail: "buyer@example.com",
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already purchased/i);
    });

    it("prevents logged-in seller from purchasing their own product as guest (403)", async () => {
      (prisma.product.findFirst as jest.Mock).mockResolvedValue(
        approvedProduct,
      );

      const res = await request(app)
        .post("/api/v1/orders/guest-purchase")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({
          productId: approvedProduct.id,
          buyerEmail: "seller-alt@example.com",
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/cannot purchase your own product/i);
    });

    it("validates email and product ID formats (422)", async () => {
      const res = await request(app)
        .post("/api/v1/orders/guest-purchase")
        .send({
          productId: "invalid-uuid",
          buyerEmail: "not-an-email",
        });

      expect(res.status).toBe(422);
    });
  });

  describe("POST /api/v1/orders/guest/request-access", () => {
    it("returns generic 200 message and sends magic link when purchases exist", async () => {
      (prisma.order.count as jest.Mock).mockResolvedValue(2);
      (prisma.guestMagicLinkToken.create as jest.Mock).mockResolvedValue({
        id: "token-1",
      });

      const res = await request(app)
        .post("/api/v1/orders/guest/request-access")
        .send({ email: "buyer@example.com" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/sent a secure access link/i);
      expect(emailService.sendMagicLink).toHaveBeenCalledTimes(1);
    });

    it("returns generic 200 message even when NO purchases exist (anti-theft protection)", async () => {
      (prisma.order.count as jest.Mock).mockResolvedValue(0);

      const res = await request(app)
        .post("/api/v1/orders/guest/request-access")
        .send({ email: "unknown@example.com" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/sent a secure access link/i);
      expect(emailService.sendMagicLink).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/v1/orders/guest/verify-access", () => {
    it("verifies valid magic link token and unlocks 7-day guest session", async () => {
      const rawToken = "gml_1234567890abcdef12345678";
      const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      (prisma.guestMagicLinkToken.findUnique as jest.Mock).mockResolvedValue({
        id: "t-1",
        email: "buyer@example.com",
        tokenHash,
        isUsed: false,
        expiresAt: new Date(Date.now() + 1800000), // 30 mins remaining
      });

      (prisma.guestMagicLinkToken.update as jest.Mock).mockResolvedValue({
        id: "t-1",
        isUsed: true,
      });

      (prisma.license.findMany as jest.Mock).mockResolvedValue([
        {
          id: "lic-1",
          productId: approvedProduct.id,
          licenseKey: "DT-ABCD-1234-EF56-7890",
          createdAt: new Date(),
          product: approvedProduct,
        },
      ]);

      const res = await request(app).get(
        `/api/v1/orders/guest/verify-access?token=${rawToken}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe("buyer@example.com");
      expect(res.body.data.purchases).toHaveLength(1);

      // Verify 7-day session cookie was set
      const cookies = res.headers["set-cookie"];
      expect(cookies.some((c: string) => c.includes("dt_guest_session"))).toBe(
        true,
      );
    });

    it("rejects already used or expired magic link token (401)", async () => {
      const rawToken = "gml_expiredorused";
      (prisma.guestMagicLinkToken.findUnique as jest.Mock).mockResolvedValue({
        id: "t-2",
        isUsed: true,
        expiresAt: new Date(Date.now() - 5000), // expired
      });

      const res = await request(app).get(
        `/api/v1/orders/guest/verify-access?token=${rawToken}`,
      );

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid or has expired/i);
    });
  });

  describe("GET /api/v1/orders/guest/purchases", () => {
    it("returns active purchases when 7-day guest session cookie is present", async () => {
      const guestEmail = "buyer@example.com";
      const sessionToken = signGuestSession(guestEmail);

      (prisma.license.findMany as jest.Mock).mockResolvedValue([
        {
          id: "lic-1",
          productId: approvedProduct.id,
          licenseKey: "DT-ABCD-1234-EF56-7890",
          createdAt: new Date(),
          product: approvedProduct,
        },
      ]);

      const res = await request(app)
        .get("/api/v1/orders/guest/purchases")
        .set("Cookie", `dt_guest_session=${sessionToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(guestEmail);
      expect(res.body.data.purchases).toHaveLength(1);
    });

    it("rejects with 401 when no guest session cookie is sent", async () => {
      const res = await request(app).get("/api/v1/orders/guest/purchases");
      expect(res.status).toBe(401);
    });
  });

  describe("Dual-Authorization Downloads (GET /api/v1/products/:id/download)", () => {
    it("allows download using valid direct guest token in query (?token=gdt_...)", async () => {
      (storageService.resolveKeyPath as jest.Mock).mockReturnValue(
        "/mock/path/workflow-pro.zip",
      );
      jest.spyOn(fs.promises, "access").mockResolvedValue(undefined);

      (storageService.stream as jest.Mock).mockImplementation(
        async (_key, res) => {
          res.status(200);
          res.end("mock binary zip contents");
        },
      );

      (prisma.license.findFirst as jest.Mock).mockResolvedValue({
        id: "lic-token",
        productId: approvedProduct.id,
        fileKey: approvedProduct.approvedFileKey,
        fileMime: approvedProduct.approvedFileMime,
        isActive: true,
        product: approvedProduct,
      });

      const res = await request(app).get(
        `/api/v1/products/${approvedProduct.id}/download?token=gdt_valid123`,
      );

      expect(res.status).toBe(200);
      expect(storageService.stream).toHaveBeenCalledWith(
        approvedProduct.approvedFileKey,
        expect.anything(),
      );
    });

    it("rejects download when no authorization is provided (401)", async () => {
      const res = await request(app).get(
        `/api/v1/products/${approvedProduct.id}/download`,
      );
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(
        /authentication or valid purchase access/i,
      );
    });

    it("rejects download when guest token is invalid (401)", async () => {
      (prisma.license.findFirst as jest.Mock).mockResolvedValue(null);

      const res = await request(app).get(
        `/api/v1/products/${approvedProduct.id}/download?token=gdt_fake`,
      );
      expect(res.status).toBe(401);
    });
  });

  describe("Automatic Guest Orders Migration on Registration", () => {
    it("migrates unlinked guest orders and licenses when user registers", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: "u-new-123",
        email: "guest@example.com",
        name: "New Registered User",
        role: "USER",
        tokenVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      (prisma.order.updateMany as jest.Mock).mockResolvedValue({ count: 2 });
      (prisma.license.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

      const res = await request(app).post("/api/v1/auth/register").send({
        email: "guest@example.com",
        password: "Password123!",
        name: "New Registered User",
      });

      expect(res.status).toBe(201);
      expect(prisma.order.updateMany).toHaveBeenCalledWith({
        where: { buyerEmail: "guest@example.com", userId: null },
        data: { userId: "u-new-123" },
      });
      expect(prisma.license.updateMany).toHaveBeenCalledWith({
        where: { buyerEmail: "guest@example.com", userId: null },
        data: { userId: "u-new-123" },
      });
    });
  });
});
