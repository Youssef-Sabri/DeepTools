import request from "supertest";
import { createApp } from "../../../app";
import { prisma } from "../../../config/database";
import { mockAdmin, mockUser, createToken } from "../../../test/test-helpers";

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

  beforeEach(() => {
    jest.clearAllMocks();

    (prisma.user.findUnique as jest.Mock).mockImplementation(({ where }) => {
      if (where.id === mockAdmin.id) return Promise.resolve(mockAdmin);
      if (where.id === mockUser.id) return Promise.resolve(mockUser);
      return Promise.resolve(null);
    });
  });

  describe("GET /api/v1/admin/settings/commission", () => {
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
