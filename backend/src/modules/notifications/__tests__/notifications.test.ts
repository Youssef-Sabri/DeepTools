import request from "supertest";
import { createApp } from "../../../app";
import { prisma } from "../../../config/database";
import { createToken, mockUser } from "../../../test/test-helpers";

jest.mock("../../../config/database", () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    notification: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

describe("Notification endpoints", () => {
  const app = createApp();
  const token = createToken(mockUser);
  const id = "11111111-1111-4111-8111-111111111111";

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.notification.count as jest.Mock).mockResolvedValue(0);
    (prisma.notification.findFirst as jest.Mock).mockResolvedValue(null);
  });

  it("requires authentication for the list and stream", async () => {
    expect((await request(app).get("/api/v1/notifications")).status).toBe(401);
    expect(
      (await request(app).get("/api/v1/notifications/stream")).status,
    ).toBe(401);
  });

  it("rejects invalid list limits and notification IDs", async () => {
    expect(
      (
        await request(app)
          .get("/api/v1/notifications?limit=1000")
          .set("Authorization", `Bearer ${token}`)
      ).status,
    ).toBe(422);
    expect(
      (
        await request(app)
          .patch("/api/v1/notifications/not-a-uuid/read")
          .set("Authorization", `Bearer ${token}`)
      ).status,
    ).toBe(422);
    expect(prisma.notification.findMany).not.toHaveBeenCalled();
    expect(prisma.notification.updateMany).not.toHaveBeenCalled();
  });

  it("scopes list and unread count to the authenticated user", async () => {
    const response = await request(app)
      .get("/api/v1/notifications?limit=10")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: mockUser.id }, take: 10 }),
    );
    expect(prisma.notification.count).toHaveBeenCalledWith({
      where: { userId: mockUser.id, isRead: false },
    });
  });

  it("cannot mark another user's notification as read", async () => {
    (prisma.notification.updateMany as jest.Mock).mockResolvedValue({
      count: 0,
    });
    const response = await request(app)
      .patch(`/api/v1/notifications/${id}/read`)
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(404);
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { id, userId: mockUser.id },
      data: { isRead: true },
    });
  });

  it("keeps an authenticated SSE connection open until the client closes it", async () => {
    const server = app.listen(0);
    try {
      const address = server.address();
      if (!address || typeof address === "string")
        throw new Error("Test server has no port");
      const controller = new AbortController();
      const response = await fetch(
        `http://127.0.0.1:${address.port}/api/v1/notifications/stream`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        },
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain(
        "text/event-stream",
      );
      const reader = response.body!.getReader();
      const initial = await reader.read();
      expect(new TextDecoder().decode(initial.value)).toContain("event: sync");
      expect(initial.done).toBe(false);
      controller.abort();
      await reader.cancel().catch(() => undefined);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
