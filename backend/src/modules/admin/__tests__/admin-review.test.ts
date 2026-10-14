import request from "supertest";
import { createApp } from "../../../app";
import { prisma } from "../../../config/database";
import { storageService } from "../../../storage/storage.service";
import { mockAdmin, mockUser, createToken } from "../../../test/test-helpers";

jest.mock("../../../config/database", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    product: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

jest.mock("../../../storage/storage.service", () => ({
  storageService: { stat: jest.fn(), checksum: jest.fn(), stream: jest.fn() },
}));

describe("Admin Upload Review Endpoints (Task B-4)", () => {
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
    (prisma.product.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    (storageService.stat as jest.Mock).mockResolvedValue({
      size: 2048,
      mimeType: "application/zip",
    });
    (storageService.checksum as jest.Mock).mockResolvedValue("abc123hash");
  });

  describe("GET and HEAD /api/v1/admin/uploads/:id/download", () => {
    const uploadId = "30000000-0000-4000-8000-000000000005";
    const url = `/api/v1/admin/uploads/${uploadId}/download`;

    it("streams the current pending upload to an admin, not the previously approved file", async () => {
      (prisma.product.findFirst as jest.Mock).mockResolvedValue({
        id: uploadId,
        name: "Review Asset",
        status: "PENDING",
        fileKey: "uploads/current-upload.zip",
        approvedFileKey: "uploads/old-approved.zip",
      });
      (storageService.stream as jest.Mock).mockImplementation(
        async (_key, res) => res.end("review file"),
      );

      const res = await request(app)
        .get(url)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers["content-disposition"]).toBe(
        'attachment; filename="Review_Asset.zip"',
      );
      expect(res.headers["content-type"]).toMatch(/application\/octet-stream/);
      expect(res.headers["cache-control"]).toBe("private, no-store");
      expect(storageService.stream).toHaveBeenCalledWith(
        "uploads/current-upload.zip",
        expect.anything(),
      );
      expect(prisma.product.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: uploadId, deletedAt: null },
        }),
      );
    });

    it("allows an admin HEAD check without starting a file stream", async () => {
      (prisma.product.findFirst as jest.Mock).mockResolvedValue({
        id: uploadId,
        name: "Review Asset",
        fileKey: "uploads/current-upload.zip",
      });

      const res = await request(app)
        .head(url)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers["content-disposition"]).toMatch(/attachment/);
      expect(storageService.stream).not.toHaveBeenCalled();
    });

    it.each(["PENDING", "APPROVED", "REJECTED"])(
      "streams a %s product to an admin without a buyer license",
      async (status) => {
        (prisma.product.findFirst as jest.Mock).mockResolvedValue({
          id: uploadId,
          name: "Review Asset",
          status,
          fileKey: "uploads/review.pdf",
        });
        (storageService.stat as jest.Mock).mockResolvedValue({
          size: 2048,
          mimeType: "application/pdf",
        });
        (storageService.stream as jest.Mock).mockImplementation(
          async (_key, res) => res.end("review file"),
        );

        const res = await request(app)
          .get(`${url}?disposition=inline`)
          .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.headers["content-disposition"]).toBe(
          'inline; filename="Review_Asset.pdf"',
        );
        expect(res.headers["content-type"]).toMatch(/^application\/pdf/);
        expect(storageService.stream).toHaveBeenCalledWith(
          "uploads/review.pdf",
          expect.anything(),
        );
      },
    );

    it("serves uploaded HTML as plain text during inline preview", async () => {
      (prisma.product.findFirst as jest.Mock).mockResolvedValue({
        id: uploadId,
        name: "Example",
        status: "REJECTED",
        fileKey: "uploads/example.html",
      });
      (storageService.stat as jest.Mock).mockResolvedValue({
        size: 128,
        mimeType: "text/html",
      });
      (storageService.stream as jest.Mock).mockImplementation(
        async (_key, res) => res.end("<script>alert(1)</script>"),
      );

      const res = await request(app)
        .get(`${url}?disposition=inline`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/^text\/plain/);
      expect(res.headers["x-content-type-options"]).toBe("nosniff");
    });

    it("rejects unsupported disposition values", async () => {
      const res = await request(app)
        .get(`${url}?disposition=preview`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(422);
      expect(prisma.product.findFirst).not.toHaveBeenCalled();
    });

    it("denies non-admin users before accessing the upload", async () => {
      const res = await request(app)
        .get(url)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(prisma.product.findFirst).not.toHaveBeenCalled();
      expect(storageService.stream).not.toHaveBeenCalled();
    });

    it("requires authentication", async () => {
      const res = await request(app).get(url);

      expect(res.status).toBe(401);
      expect(prisma.product.findFirst).not.toHaveBeenCalled();
    });

    it("returns a conflict when the uploaded file is unavailable", async () => {
      (prisma.product.findFirst as jest.Mock).mockResolvedValue({
        id: uploadId,
        name: "Review Asset",
        fileKey: "uploads/missing.zip",
      });
      (storageService.stat as jest.Mock).mockRejectedValue(
        new Error("Missing file"),
      );

      const res = await request(app)
        .get(url)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(409);
      expect(storageService.stream).not.toHaveBeenCalled();
    });
  });

  describe("PATCH /api/v1/admin/uploads/:id/approve", () => {
    it("approves a pending product successfully", async () => {
      (prisma.product.findFirst as jest.Mock).mockResolvedValue({
        id: "30000000-0000-4000-8000-000000000001",
        name: "Pending Upload",
        status: "PENDING",
        fileKey: "uploads/file-1.zip",
        fileSize: 2048,
        fileMime: "application/zip",
        fileChecksum: "abc123hash",
        updatedAt: new Date(),
      });

      const now = new Date();
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: "30000000-0000-4000-8000-000000000001",
        name: "Pending Upload",
        status: "APPROVED",
        reviewedAt: now,
        seller: { id: "seller-1", name: "Seller", email: "seller@test.com" },
      });

      const res = await request(app)
        .patch(
          "/api/v1/admin/uploads/30000000-0000-4000-8000-000000000001/approve",
        )
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("APPROVED");
      expect(prisma.product.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "30000000-0000-4000-8000-000000000001",
            status: "PENDING",
            deletedAt: null,
          }),
          data: expect.objectContaining({ status: "APPROVED" }),
        }),
      );
    });

    it("returns 409 when approving already-approved product", async () => {
      (prisma.product.findFirst as jest.Mock).mockResolvedValue({
        id: "30000000-0000-4000-8000-000000000003",
        status: "APPROVED",
      });

      const res = await request(app)
        .patch(
          "/api/v1/admin/uploads/30000000-0000-4000-8000-000000000003/approve",
        )
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/only pending/i);
    });

    it("returns 403 when regular user token is used on admin route", async () => {
      const res = await request(app)
        .patch(
          "/api/v1/admin/uploads/30000000-0000-4000-8000-000000000001/approve",
        )
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("PATCH /api/v1/admin/uploads/:id/reject", () => {
    it("rejects a product with reason successfully", async () => {
      (prisma.product.findFirst as jest.Mock).mockResolvedValue({
        id: "30000000-0000-4000-8000-000000000002",
        status: "PENDING",
        updatedAt: new Date(),
      });

      const now = new Date();
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: "30000000-0000-4000-8000-000000000002",
        status: "REJECTED",
        rejectionNote: "File contains prohibited libraries.",
        reviewedAt: now,
      });

      const res = await request(app)
        .patch(
          "/api/v1/admin/uploads/30000000-0000-4000-8000-000000000002/reject",
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reason: "File contains prohibited libraries." });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("REJECTED");
    });

    it("returns 422 when rejecting without reason or reason is empty", async () => {
      const res = await request(app)
        .patch(
          "/api/v1/admin/uploads/30000000-0000-4000-8000-000000000002/reject",
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(422);
    });

    it("returns 409 when rejecting already-rejected product", async () => {
      (prisma.product.findFirst as jest.Mock).mockResolvedValue({
        id: "30000000-0000-4000-8000-000000000004",
        status: "REJECTED",
      });

      const res = await request(app)
        .patch(
          "/api/v1/admin/uploads/30000000-0000-4000-8000-000000000004/reject",
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reason: "Duplicate rejection attempt." });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/only pending/i);
    });
  });
});
