import request from "supertest";
import { createApp } from "../../../app";
import { prisma } from "../../../config/database";
import { mockAdmin, mockUser, createToken } from "../../../test/test-helpers";

jest.mock("../../../config/database", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    product: {
      count: jest.fn(),
    },
  },
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    product: {
      count: jest.fn(),
    },
  },
}));

describe("Dynamic Categories Endpoints (Phase 2)", () => {
  const app = createApp();
  const adminToken = createToken(mockAdmin);
  const userToken = createToken(mockUser);

  const mockCategory1 = {
    id: "d0000000-0000-0000-0000-000000000001",
    slug: "workflows",
    name: "Workflows",
    nameAr: "سيناريوهات العمل",
    description: "Automated workflow blueprints",
    descriptionAr: "مخططات مسارات عمل مؤتمتة",
    deletedAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    _count: { products: 5 },
  };

  const mockCategory2 = {
    id: "d0000000-0000-0000-0000-000000000002",
    slug: "ai-agents",
    name: "AI Agents",
    nameAr: "وكلاء الذكاء الاصطناعي",
    description: "Autonomous reasoning agents",
    descriptionAr: "وكلاء تفكير ذاتيون",
    deletedAt: null,
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    _count: { products: 0 },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (prisma.user.findUnique as jest.Mock).mockImplementation(({ where }) => {
      if (where.id === mockAdmin.id) return Promise.resolve(mockAdmin);
      if (where.id === mockUser.id) return Promise.resolve(mockUser);
      return Promise.resolve(null);
    });
  });

  describe("GET /api/v1/categories (Public Directory)", () => {
    it("returns active categories with product counts and default English displayName", async () => {
      (prisma.category.findMany as jest.Mock).mockResolvedValue([
        mockCategory1,
        mockCategory2,
      ]);

      const res = await request(app).get("/api/v1/categories");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].displayName).toBe("Workflows");
      expect(res.body.data[0].productCount).toBe(5);
      expect(res.body.data[1].displayName).toBe("AI Agents");
      expect(res.body.data[1].productCount).toBe(0);
    });

    it("returns Arabic displayName when ?lang=ar is requested", async () => {
      (prisma.category.findMany as jest.Mock).mockResolvedValue([
        mockCategory1,
      ]);

      const res = await request(app).get("/api/v1/categories?lang=ar");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].displayName).toBe("سيناريوهات العمل");
      expect(res.body.data[0].displayDescription).toBe(
        "مخططات مسارات عمل مؤتمتة",
      );
    });
  });

  describe("GET /api/v1/categories/:id", () => {
    it("returns 200 and category details for a valid id", async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(
        mockCategory1,
      );
      (prisma.product.count as jest.Mock).mockResolvedValue(5);

      const res = await request(app).get(
        `/api/v1/categories/${mockCategory1.id}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(mockCategory1.id);
      expect(res.body.data.name).toBe("Workflows");
      expect(res.body.data.nameAr).toBe("سيناريوهات العمل");
    });

    it("returns 404 if category does not exist", async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).get(
        "/api/v1/categories/d0000000-0000-0000-0000-000000000999",
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/admin/categories", () => {
    it("rejects unauthenticated requests with 401", async () => {
      const res = await request(app)
        .post("/api/v1/admin/categories")
        .send({ name: "Scripts", nameAr: "نصوص" });

      expect(res.status).toBe(401);
    });

    it("rejects non-admin users with 403", async () => {
      const res = await request(app)
        .post("/api/v1/admin/categories")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "Scripts", nameAr: "نصوص" });

      expect(res.status).toBe(403);
    });

    it("creates a new category when admin supplies valid English and Arabic fields", async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.category.create as jest.Mock).mockResolvedValue({
        id: "d0000000-0000-0000-0000-000000000003",
        slug: "scripts",
        name: "Scripts",
        nameAr: "نصوص برمجية",
        description: "Automation scripts",
        descriptionAr: "نصوص أتمتة برمجية",
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post("/api/v1/admin/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Scripts",
          nameAr: "نصوص برمجية",
          description: "Automation scripts",
          descriptionAr: "نصوص أتمتة برمجية",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe("scripts");
      expect(res.body.data.nameAr).toBe("نصوص برمجية");
    });

    it("persists icon and displayOrder instead of silently dropping them", async () => {
      // Regression guard: the frontend sent icon/displayOrder but the schema had
      // no such columns, so Zod stripped them and the API replied 201 while
      // discarding the values -- admin choices vanished with no error.
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.category.create as jest.Mock).mockResolvedValue({
        id: "d0000000-0000-0000-0000-000000000009",
        slug: "ai-agents",
        name: "AI Agents",
        nameAr: "وكلاء",
        icon: "Cpu",
        displayOrder: 7,
        isActive: true,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post("/api/v1/admin/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          slug: "ai-agents",
          name: "AI Agents",
          nameAr: "وكلاء",
          icon: "Cpu",
          displayOrder: 7,
        });

      expect(res.status).toBe(201);
      expect(prisma.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            icon: "Cpu",
            displayOrder: 7,
          }),
        }),
      );
    });

    it("rejects a negative displayOrder with 422", async () => {
      const res = await request(app)
        .post("/api/v1/admin/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Bad Order",
          nameAr: "ترتيب خاطئ",
          displayOrder: -5,
        });

      expect(res.status).toBe(422);
    });

    it("honours isActive on update (deactivating a category)", async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue({
        id: "d0000000-0000-4000-8000-000000000001",
        slug: "workflow",
        name: "Workflows",
        nameAr: "مسارات",
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (prisma.category.update as jest.Mock).mockResolvedValue({
        id: "d0000000-0000-4000-8000-000000000001",
        slug: "workflow",
        name: "Workflows",
        nameAr: "مسارات",
        isActive: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .put("/api/v1/admin/categories/d0000000-0000-4000-8000-000000000001")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(200);
      expect(prisma.category.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isActive: false }),
        }),
      );
    });

    it("rejects creation with 422 if nameAr contains non-Arabic text", async () => {
      const res = await request(app)
        .post("/api/v1/admin/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Scripts",
          nameAr: "EnglishOnlyText",
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it("rejects creation with 422 if English name lacks Latin characters", async () => {
      const res = await request(app)
        .post("/api/v1/admin/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "12345",
          nameAr: "نصوص برمجية",
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it("rejects creation with 409 if category slug already exists", async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(
        mockCategory1,
      );

      const res = await request(app)
        .post("/api/v1/admin/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Workflows Duplicate",
          nameAr: "مسارات بديلة",
          slug: "workflows",
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe("PUT /api/v1/admin/categories/:id", () => {
    it("updates category details successfully", async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(
        mockCategory1,
      );
      (prisma.category.update as jest.Mock).mockResolvedValue({
        ...mockCategory1,
        name: "Workflows Updated",
      });

      const res = await request(app)
        .put(`/api/v1/admin/categories/${mockCategory1.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Workflows Updated",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Workflows Updated");
    });
  });

  describe("DELETE /api/v1/admin/categories/:id (Safe Deletion Protection)", () => {
    it("blocks deletion with 409 Conflict if category has active products", async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(
        mockCategory1,
      );
      (prisma.product.count as jest.Mock).mockResolvedValue(5);

      const res = await request(app)
        .delete(`/api/v1/admin/categories/${mockCategory1.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain(
        "Cannot delete category with active products",
      );
    });

    it("successfully soft-deletes category when no active products exist", async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(
        mockCategory2,
      );
      (prisma.product.count as jest.Mock).mockResolvedValue(0);
      (prisma.category.update as jest.Mock).mockResolvedValue({
        ...mockCategory2,
        deletedAt: new Date(),
      });

      const res = await request(app)
        .delete(`/api/v1/admin/categories/${mockCategory2.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Category deleted successfully");
    });
  });
});
