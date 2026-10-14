import request from "supertest";
import { createApp } from "../../../app";
import { prisma } from "../../../config/database";
import { mockAdmin, mockUser, createToken } from "../../../test/test-helpers";
import { env } from "../../../config/env";
import { settingsService } from "../settings.service";

jest.mock("../../../config/database", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    setting: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

describe("Commission Settings Endpoints (Task B-5)", () => {
  const app = createApp();
  const adminToken = createToken(mockAdmin);
  const userToken = createToken(mockUser);
  const initialFallback = env.COMMISSION_PERCENT;

  afterEach(() => { env.COMMISSION_PERCENT = initialFallback; });

  beforeEach(() => {
    jest.clearAllMocks();

    (prisma.user.findUnique as jest.Mock).mockImplementation(({ where }) => {
      if (where.id === mockAdmin.id) return Promise.resolve(mockAdmin);
      if (where.id === mockUser.id) return Promise.resolve(mockUser);
      return Promise.resolve(null);
    });
  });

  describe("GET /api/v1/admin/settings/commission", () => {
    it("preserves a configured 0% fallback and stored 0% value", async () => {
      env.COMMISSION_PERCENT = 0;
      (prisma.setting.findUnique as jest.Mock).mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ value: "0", updatedAt: new Date() });
      const fallback = await request(app).get("/api/v1/admin/settings/commission")
        .set("Authorization", `Bearer ${adminToken}`);
      const stored = await request(app).get("/api/v1/admin/settings/commission")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(fallback.body.data.commissionPercent).toBe(0);
      expect(stored.body.data.commissionPercent).toBe(0);
      (prisma.setting.findUnique as jest.Mock).mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ value: "0", updatedAt: new Date() });
      expect(await settingsService.getCommissionPercent()).toBe(0);
      expect(await settingsService.getCommissionPercent()).toBe(0);
    });
    it("returns env default commission when no DB row exists", async () => {
      (prisma.setting.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get("/api/v1/admin/settings/commission")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.commissionPercent).toBe(10);
    });

    it("returns stored commission when DB row exists", async () => {
      (prisma.setting.findUnique as jest.Mock).mockResolvedValue({
        id: "set-1",
        key: "commission_percent",
        value: "15",
        updatedAt: new Date(),
      });

      const res = await request(app)
        .get("/api/v1/admin/settings/commission")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.commissionPercent).toBe(15);
    });

    it("returns 403 when called with a regular user token", async () => {
      const res = await request(app)
        .get("/api/v1/admin/settings/commission")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it("returns 401 when no token is provided", async () => {
      const res = await request(app).get("/api/v1/admin/settings/commission");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/settings/commission", () => {
    it("returns the current stored rate to a signed-in seller", async () => {
      (prisma.setting.findUnique as jest.Mock).mockResolvedValue({
        value: "27",
        updatedAt: new Date(),
      });

      const res = await request(app)
        .get("/api/v1/settings/commission")
        .set("Cookie", `dt_session=${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.commissionPercent).toBe(27);
    });

    it("lets a signed-in seller read the configured rate, including 0%", async () => {
      (prisma.setting.findUnique as jest.Mock).mockResolvedValue({
        value: "0",
        updatedAt: new Date(),
      });

      const res = await request(app)
        .get("/api/v1/settings/commission")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.commissionPercent).toBe(0);
    });

    it("requires authentication and does not expose commission updates", async () => {
      const unauthenticated = await request(app).get("/api/v1/settings/commission");
      const update = await request(app)
        .patch("/api/v1/settings/commission")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ commissionPercent: 0 });

      expect(unauthenticated.status).toBe(401);
      expect(update.status).toBe(404);
      expect(prisma.setting.upsert).not.toHaveBeenCalled();
    });
  });

  describe("PATCH /api/v1/admin/settings/commission", () => {
    it("updates commission successfully with valid integer 0-100", async () => {
      const now = new Date();
      (prisma.setting.upsert as jest.Mock).mockResolvedValue({
        id: "set-1",
        key: "commission_percent",
        value: "20",
        updatedAt: now,
      });

      const res = await request(app)
        .patch("/api/v1/admin/settings/commission")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ commissionPercent: 20 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.commissionPercent).toBe(20);
    });

    it("returns 422 when commissionPercent is invalid (< 0 or > 100 or float)", async () => {
      const res1 = await request(app)
        .patch("/api/v1/admin/settings/commission")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ commissionPercent: 150 });
      expect(res1.status).toBe(422);

      const res2 = await request(app)
        .patch("/api/v1/admin/settings/commission")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ commissionPercent: -5 });
      expect(res2.status).toBe(422);

      const res3 = await request(app)
        .patch("/api/v1/admin/settings/commission")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ commissionPercent: 12.5 });
      expect(res3.status).toBe(422);
    });
  });
});
