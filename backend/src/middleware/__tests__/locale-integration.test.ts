import request from "supertest";
import { createApp } from "../../app";
import { prisma } from "../../config/database";

jest.mock("../../config/database", () => ({
  prisma: {
    $transaction: jest.fn((cb) => cb(prisma)),
    user: {
      findUnique: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    setting: {
      findUnique: jest.fn(),
    },
    product: {
      count: jest.fn(),
    },
    order: {
      findMany: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
  },
  __esModule: true,
  default: {
    $transaction: jest.fn((cb) => cb(prisma)),
  },
}));

describe("Bilingual API Integration Tests", () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Content-Language & Category Localization", () => {
    it("returns Content-Language: ar and Arabic display fields when Accept-Language: ar is provided", async () => {
      (prisma.category.findMany as jest.Mock).mockResolvedValue([
        {
          id: "cat-1",
          slug: "workflows",
          name: "Workflows",
          nameAr: "مسارات العمل المتقدمة",
          description: "Automated workflows",
          descriptionAr: "مسارات عمل مؤتمتة",
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          _count: { products: 5 },
        },
      ]);

      const res = await request(app)
        .get("/api/v1/categories")
        .set("Accept-Language", "ar-EG,ar;q=0.9");

      expect(res.status).toBe(200);
      expect(res.headers["content-language"]).toBe("ar");
      expect(res.headers["vary"]).toContain("Accept-Language");
      expect(res.body.data[0].displayName).toBe("مسارات العمل المتقدمة");
      expect(res.body.data[0].displayDescription).toBe("مسارات عمل مؤتمتة");
    });

    it("returns Content-Language: en and English display fields when Accept-Language: en is provided", async () => {
      (prisma.category.findMany as jest.Mock).mockResolvedValue([
        {
          id: "cat-1",
          slug: "workflows",
          name: "Workflows",
          nameAr: "مسارات العمل المتقدمة",
          description: "Automated workflows",
          descriptionAr: "مسارات عمل مؤتمتة",
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          _count: { products: 5 },
        },
      ]);

      const res = await request(app)
        .get("/api/v1/categories")
        .set("Accept-Language", "en-US,en;q=0.8");

      expect(res.status).toBe(200);
      expect(res.headers["content-language"]).toBe("en");
      expect(res.body.data[0].displayName).toBe("Workflows");
      expect(res.body.data[0].displayDescription).toBe("Automated workflows");
    });
  });

  describe("Localized Error & Operational Responses", () => {
    it("returns Arabic error message on invalid login when Accept-Language: ar is requested", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post("/api/v1/auth/login")
        .set("Accept-Language", "ar")
        .send({
          email: "unknown@example.com",
          password: "Password123!",
        });

      expect(res.status).toBe(401);
      expect(res.headers["content-language"]).toBe("ar");
      expect(res.body.message).toBe("بيانات الاعتماد غير صالحة");
    });

    it("returns English error message on invalid login by default", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).post("/api/v1/auth/login").send({
        email: "unknown@example.com",
        password: "Password123!",
      });

      expect(res.status).toBe(401);
      expect(res.headers["content-language"]).toBe("en");
      expect(res.body.message).toBe("Invalid email or password");
    });

    it("returns 404 for unmounted routes", async () => {
      const res = await request(app)
        .post("/api/v1/orders/non-existent-action")
        .send({ productId: "00000000-0000-4000-8000-000000000001" });
      expect(res.status).toBe(404);
    });
  });
});
