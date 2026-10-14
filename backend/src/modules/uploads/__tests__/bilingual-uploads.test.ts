import request from "supertest";
import { createApp } from "../../../app";
import { prisma } from "../../../config/database";
import { mockUser, createToken } from "../../../test/test-helpers";
import { storageService } from "../../../storage/storage.service";

jest.mock("../../../config/database", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    product: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
  },
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
    product: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

jest.mock("../../../storage/storage.service", () => ({
  storageService: {
    save: jest.fn().mockResolvedValue("test-file-key"),
    stat: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
  },
}));

describe("Mandatory Bilingual Uploads (Phase 2)", () => {
  const app = createApp();
  const userToken = createToken(mockUser);
  const fakeZip = Buffer.from("PK\x03\x04test zip content");

  beforeEach(() => {
    jest.clearAllMocks();

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (storageService.stat as jest.Mock).mockResolvedValue({
      size: fakeZip.length,
      mimeType: "application/zip",
    });
  });

  it("successfully creates pending upload when authentic English and Arabic fields are supplied", async () => {
    (prisma.product.create as jest.Mock).mockResolvedValue({
      id: "20000000-0000-4000-8000-000000000001",
      sellerId: mockUser.id,
      name: "AI Autonomous Agent",
      nameAr: "وكيل ذكاء اصطناعي ذاتي",
      description: "An autonomous agent built for high throughput tasks",
      descriptionAr:
        "وكيل ذكاء اصطناعي مستقل مصمم لتنفيذ المهام المعقدة بكفاءة عالية",
      category: "agentic",
      price: 4900,
      status: "PENDING",
    });

    const res = await request(app)
      .post("/api/v1/uploads")
      .set("Authorization", `Bearer ${userToken}`)
      .field("name", "AI Autonomous Agent")
      .field("nameAr", "وكيل ذكاء اصطناعي ذاتي")
      .field(
        "description",
        "An autonomous agent built for high throughput tasks",
      )
      .field(
        "descriptionAr",
        "وكيل ذكاء اصطناعي مستقل مصمم لتنفيذ المهام المعقدة بكفاءة عالية",
      )
      .field("category", "agentic")
      .field("price", 4900)
      .attach("file", fakeZip, "agent.zip");

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.nameAr).toBe("وكيل ذكاء اصطناعي ذاتي");
  });

  it("accepts authentic Arabic punctuation and Tashkeel in Arabic fields", async () => {
    (prisma.product.create as jest.Mock).mockResolvedValue({
      id: "20000000-0000-4000-8000-000000000002",
      sellerId: mockUser.id,
      name: "Smart Workflow Automation",
      nameAr:
        "مُؤْتَمَتُ سِينارِيُوهَاتِ العَمَلِ، وَالأَدَوَاتِ؛ الحَدِيثَةِ؟",
      description: "Complete workflow suite for automated processes",
      descriptionAr:
        "حُزْمَةُ أَدَوَاتٍ مُتَكَامِلَةٍ لِأَتْمَتَةِ العَمَلِيَّاتِ بِسُرْعَةٍ وَدِقَّةٍ",
      category: "workflow",
      price: 3500,
      status: "PENDING",
    });

    const res = await request(app)
      .post("/api/v1/uploads")
      .set("Authorization", `Bearer ${userToken}`)
      .field("name", "Smart Workflow Automation")
      .field(
        "nameAr",
        "مُؤْتَمَتُ سِينارِيُوهَاتِ العَمَلِ، وَالأَدَوَاتِ؛ الحَدِيثَةِ؟",
      )
      .field("description", "Complete workflow suite for automated processes")
      .field(
        "descriptionAr",
        "حُزْمَةُ أَدَوَاتٍ مُتَكَامِلَةٍ لِأَتْمَتَةِ العَمَلِيَّاتِ بِسُرْعَةٍ وَدِقَّةٍ",
      )
      .field("category", "workflow")
      .field("price", 3500)
      .attach("file", fakeZip, "workflow.zip");

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("rejects upload with 422 if Arabic title (nameAr) is missing", async () => {
    const res = await request(app)
      .post("/api/v1/uploads")
      .set("Authorization", `Bearer ${userToken}`)
      .field("name", "Workflow Without Arabic")
      .field("description", "Valid English description for testing")
      .field("descriptionAr", "وصف عربي صحيح وكامل للمنتج")
      .field("category", "workflow")
      .field("price", 2000)
      .attach("file", fakeZip, "workflow.zip");

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it("rejects upload with 422 if Arabic description (descriptionAr) is missing", async () => {
    const res = await request(app)
      .post("/api/v1/uploads")
      .set("Authorization", `Bearer ${userToken}`)
      .field("name", "Workflow Automation")
      .field("nameAr", "مسار عمل مؤتمت")
      .field("description", "Valid English description for testing")
      .field("category", "workflow")
      .field("price", 2000)
      .attach("file", fakeZip, "workflow.zip");

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it("rejects upload with 422 if nameAr contains English text instead of Arabic", async () => {
    const res = await request(app)
      .post("/api/v1/uploads")
      .set("Authorization", `Bearer ${userToken}`)
      .field("name", "Valid English Name")
      .field("nameAr", "Invalid English In Arabic Field")
      .field("description", "Valid English description for testing")
      .field("descriptionAr", "وصف عربي صحيح وكامل للمنتج")
      .field("category", "workflow")
      .field("price", 2000)
      .attach("file", fakeZip, "workflow.zip");

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it("rejects upload with 422 if Arabic field contains only digits or punctuation without letters", async () => {
    const res = await request(app)
      .post("/api/v1/uploads")
      .set("Authorization", `Bearer ${userToken}`)
      .field("name", "Valid English Name")
      .field("nameAr", "123456789")
      .field("description", "Valid English description for testing")
      .field("descriptionAr", "وصف عربي صحيح وكامل للمنتج")
      .field("category", "workflow")
      .field("price", 2000)
      .attach("file", fakeZip, "workflow.zip");

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it("rejects upload with 422 if English name lacks Latin characters", async () => {
    const res = await request(app)
      .post("/api/v1/uploads")
      .set("Authorization", `Bearer ${userToken}`)
      .field("name", "123456")
      .field("nameAr", "اسم عربي صحيح")
      .field("description", "Valid English description for testing")
      .field("descriptionAr", "وصف عربي صحيح وكامل للمنتج")
      .field("category", "workflow")
      .field("price", 2000)
      .attach("file", fakeZip, "workflow.zip");

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });
});
