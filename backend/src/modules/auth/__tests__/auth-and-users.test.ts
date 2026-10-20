import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "../../../app";
import { prisma } from "../../../config/database";
import { mockAdmin, mockUser, createToken } from "../../../test/test-helpers";
import { csrfForSession } from "../session";

jest.mock("../../../config/database", () => {
  const prisma = {
    $transaction: jest.fn(async (callback: (tx: unknown) => unknown) =>
      callback(prisma),
    ),
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    passwordResetToken: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    order: {
      updateMany: jest.fn(),
    },
    license: {
      updateMany: jest.fn(),
    },
  };
  return { prisma };
});

describe("Engineer A: Auth, Users, & Admin Users Tests (Tasks A-1 to A-7)", () => {
  const app = createApp();
  const adminToken = createToken(mockAdmin);
  const userToken = createToken(mockUser);

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findUnique as jest.Mock).mockImplementation(({ where }) => {
      if (where.id === mockUser.id) return Promise.resolve(mockUser);
      if (where.id === mockAdmin.id) return Promise.resolve(mockAdmin);
      return Promise.resolve(null);
    });
  });

  it("requires a matching CSRF header for cookie-authenticated state changes", async () => {
    const csrf = csrfForSession(userToken);
    const cookies = `dt_auth=${userToken}; dt_csrf=${csrf}`;
    const rejected = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", cookies);
    expect(rejected.status).toBe(403);
    const accepted = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", cookies)
      .set("X-CSRF-Token", csrf);
    expect(accepted.status).toBe(204);
    expect(accepted.headers["set-cookie"]).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^dt_auth=;/),
        expect.stringMatching(/^dt_csrf=;/),
      ]),
    );
  });

  it("clears an expired session when its CSRF token matches", async () => {
    const expiredToken = "expired.jwt.value";
    const csrf = csrfForSession(expiredToken);
    const res = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", `dt_auth=${expiredToken}; dt_csrf=${csrf}`)
      .set("X-CSRF-Token", csrf);
    expect(res.status).toBe(204);
  });

  describe("Task A-2: Register and Login", () => {
    it("always creates role = user ignoring any client role input (Rule 5.1)", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: "new-user-1",
        name: "New Tester",
        email: "newtester@example.com",
        role: "USER",
        deletedAt: null,
        tokenVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app).post("/api/v1/auth/register").send({
        name: "New Tester",
        email: "newtester@example.com",
        password: "Password123!",
        role: "ADMIN", // Client tries to elevate role
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: "USER", // Server strictly enforces USER
          }),
        }),
      );
    });

    it("normalizes the registration email to lowercase (unique-index safety)", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: "new-user-3",
        name: "Case Test",
        email: "mixed@example.com",
        role: "USER",
        deletedAt: null,
        tokenVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app).post("/api/v1/auth/register").send({
        name: "Case Test",
        email: "Mixed@Example.COM",
        password: "Password123!",
      });

      expect(res.status).toBe(201);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: "mixed@example.com" }),
        }),
      );
    });

    it("returns generic error on invalid login to prevent enumeration (Rule 5.4)", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).post("/api/v1/auth/login").send({
        email: "unknown@example.com",
        password: "Password123!",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid email or password/i);
    });

    it("successfully logs in with valid credentials", async () => {
      const passwordHash = await bcrypt.hash("CorrectPass123!", 12);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        passwordHash,
        role: "USER",
        deletedAt: null,
        tokenVersion: 0,
      });

      const res = await request(app).post("/api/v1/auth/login").send({
        email: mockUser.email,
        password: "CorrectPass123!",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).not.toHaveProperty("token");
      expect(res.headers["set-cookie"]).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/^dt_auth=.*HttpOnly/),
          expect.stringMatching(/^dt_csrf=/),
        ]),
      );
      expect(res.body.data.user).not.toHaveProperty("passwordHash");
    });
  });

  describe("Task A-3: Password Reset", () => {
    it("returns identical generic success message whether email exists or not", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: "nonexistent@example.com" });

      expect(res.status).toBe(503);
      expect(res.body.message).toMatch(/temporarily unavailable/i);
    });
  });

  describe("Task A-4: Own Profile", () => {
    it("returns current user profile without passwordHash", async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        ...mockUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: "USER",
        tokenVersion: 0,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .get("/api/v1/users/me")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(mockUser.email);
      expect(res.body.data).not.toHaveProperty("passwordHash");
    });

    it("rejects unauthenticated requests to own profile with 401", async () => {
      const res = await request(app).get("/api/v1/users/me");
      expect(res.status).toBe(401);
    });
  });

  describe("Task A-5: Admin: Users & Insights", () => {
    it("rejects a deleted admin even when the JWT was previously valid", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockAdmin,
        deletedAt: new Date(),
      });
      const res = await request(app)
        .get("/api/v1/admin/users")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(401);
    });

    it("uses the current database role and token version", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        ...mockAdmin,
        role: "USER",
      });
      const demoted = await request(app)
        .get("/api/v1/admin/users")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(demoted.status).toBe(403);

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        ...mockAdmin,
        tokenVersion: 1,
      });
      const revoked = await request(app)
        .get("/api/v1/admin/users")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(revoked.status).toBe(401);
    });
    it("allows Admin to list users and supports pagination & search", async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        mockUser,
        mockAdmin,
      ]);
      (prisma.user.count as jest.Mock).mockResolvedValue(2);

      const res = await request(app)
        .get("/api/v1/admin/users?page=1&limit=10")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users).toHaveLength(2);
      expect(res.body.data.meta.total).toBe(2);
    });

    it("rejects regular User from accessing /api/v1/admin/users with 403", async () => {
      const res = await request(app)
        .get("/api/v1/admin/users")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it("allows Admin to view /api/v1/admin/insights/users", async () => {
      (prisma.user.count as jest.Mock)
        .mockResolvedValueOnce(50) // totalUsers
        .mockResolvedValueOnce(12); // newUsers

      const res = await request(app)
        .get("/api/v1/admin/insights/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalUsers).toBe(50);
      expect(res.body.data.newUsers).toBe(12);
      expect(res.body.data.period).toBe("last_30_days");
    });

    it("rejects regular User from accessing /api/v1/admin/insights/users with 403", async () => {
      const res = await request(app)
        .get("/api/v1/admin/insights/users")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });
});
