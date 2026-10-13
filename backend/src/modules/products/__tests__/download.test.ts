import request from "supertest";
import fs from "fs";
import { createApp } from "../../../app";
import { prisma } from "../../../config/database";
import { storageService } from "../../../storage/storage.service";
import { mockBuyer, createToken } from "../../../test/test-helpers";

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
  },
}));

jest.mock("../../../storage/storage.service", () => ({
  storageService: {
    resolveKeyPath: jest.fn(),
    stream: jest.fn(),
  },
}));

describe("Product Download Endpoints (Task B-6)", () => {
  const app = createApp();
  const buyerToken = createToken(mockBuyer);

  const testProduct = {
    id: "10000000-0000-4000-8000-000000000200",
    name: "Automation Pro",
    status: "PENDING",
    deletedAt: new Date(),
    fileKey: "uploads/unreviewed-replacement.zip",
    approvedFileKey: "uploads/file-200.zip",
    fileMime: "application/zip",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.product.findFirst as jest.Mock).mockResolvedValue(null);

    (prisma.user.findUnique as jest.Mock).mockImplementation(({ where }) => {
      if (where.id === mockBuyer.id) return Promise.resolve(mockBuyer);
      return Promise.resolve(null);
    });
  });

  it("returns 403 when user attempts to download without a license", async () => {
    (prisma.license.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .get(`/api/v1/products/${testProduct.id}/download`)
      .set("Authorization", `Bearer ${buyerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/do not have a license/i);
  });

  it("allows the creator to download their own uploaded file without a license", async () => {
    (prisma.product.findFirst as jest.Mock).mockResolvedValue({
      ...testProduct,
      sellerId: mockBuyer.id,
      deletedAt: null,
    });
    (storageService.resolveKeyPath as jest.Mock).mockReturnValue(
      "/mock/path/creator.zip",
    );
    jest.spyOn(fs.promises, "access").mockResolvedValue(undefined);
    (storageService.stream as jest.Mock).mockImplementation(async (_key, res) =>
      res.end("creator file"),
    );
    const res = await request(app)
      .get(`/api/v1/products/${testProduct.id}/download`)
      .set("Authorization", `Bearer ${buyerToken}`);
    expect(res.status).toBe(200);
    expect(storageService.stream).toHaveBeenCalledWith(
      testProduct.fileKey,
      expect.anything(),
    );
    expect(prisma.license.findFirst).not.toHaveBeenCalled();
  });

  it("returns 403 when user license is inactive or revoked", async () => {
    (prisma.license.findFirst as jest.Mock).mockResolvedValue({
      id: "lic-revoked",
      userId: mockBuyer.id,
      productId: testProduct.id,
      isActive: false,
    });

    const res = await request(app)
      .get(`/api/v1/products/${testProduct.id}/download`)
      .set("Authorization", `Bearer ${buyerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/inactive or revoked/i);
  });

  it("streams file with attachment header when user has active license", async () => {
    (prisma.license.findFirst as jest.Mock).mockResolvedValue({
      id: "lic-valid",
      userId: mockBuyer.id,
      productId: testProduct.id,
      isActive: true,
      fileKey: testProduct.approvedFileKey,
      fileMime: testProduct.fileMime,
      product: testProduct,
    });

    (prisma.product.findFirst as jest.Mock).mockResolvedValue(testProduct);

    // Mock resolveKeyPath and fs.promises.access
    (storageService.resolveKeyPath as jest.Mock).mockReturnValue(
      "/mock/path/file-200.zip",
    );
    jest.spyOn(fs.promises, "access").mockResolvedValue(undefined);

    (storageService.stream as jest.Mock).mockImplementation(
      async (_key, res) => {
        res.status(200);
        res.end("mock binary zip contents");
      },
    );

    const res = await request(app)
      .get(`/api/v1/products/${testProduct.id}/download`)
      .set("Authorization", `Bearer ${buyerToken}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-disposition"]).toMatch(/attachment; filename=/);
    expect(res.headers["content-type"]).toMatch(/application\/zip/);
    expect(storageService.stream).toHaveBeenCalledWith(
      testProduct.approvedFileKey,
      expect.anything(),
    );
  });

  it("authorizes a HEAD download without reading the file stream", async () => {
    (prisma.license.findFirst as jest.Mock).mockResolvedValue({
      id: "lic-valid",
      userId: mockBuyer.id,
      productId: testProduct.id,
      isActive: true,
      fileKey: testProduct.approvedFileKey,
      fileMime: testProduct.fileMime,
      product: testProduct,
    });
    (storageService.resolveKeyPath as jest.Mock).mockReturnValue(
      "/mock/path/file-200.zip",
    );
    jest.spyOn(fs.promises, "access").mockResolvedValue(undefined);

    const res = await request(app)
      .head(`/api/v1/products/${testProduct.id}/download`)
      .set("Authorization", `Bearer ${buyerToken}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-disposition"]).toMatch(/attachment/);
    expect(storageService.stream).not.toHaveBeenCalled();
  });
});
