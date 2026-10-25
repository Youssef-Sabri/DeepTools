import { Router, Request, Response } from "express";
import { prisma } from "../../config/database";
import { authenticate } from "../../middleware/auth.middleware";
import {
  validateParams,
  validateQuery,
} from "../../middleware/validation.middleware";
import { uuidIdParamsSchema } from "../../middleware/requestBounds";
import { asyncHandler } from "../../utils/asyncHandler";
import { NotFoundError } from "../../utils/apiError";
import { z } from "zod";

const router = Router();
router.use(authenticate);

const listQuery = z
  .object({
    limit: z.coerce.number().int().min(1).max(50).default(30),
  })
  .strict();

router.get(
  "/",
  validateQuery(listQuery),
  asyncHandler(async (req: Request, res: Response) => {
    const { limit } = listQuery.parse(req.query);
    const userId = req.user!.id;
    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit,
      }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    res.setHeader("Cache-Control", "private, no-store");
    res.json({ success: true, data: { items, unreadCount } });
  }),
);

router.patch(
  "/:id/read",
  validateParams(uuidIdParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user!.id;
    const result = await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
    if (result.count === 0) throw new NotFoundError("Notification not found");
    res.setHeader("Cache-Control", "private, no-store");
    res.json({ success: true, data: { id, isRead: true } });
  }),
);

const activeStreams = new Map<string, number>();
const MAX_STREAMS_PER_USER = 5;

router.get(
  "/stream",
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const openStreams = activeStreams.get(userId) || 0;
    if (openStreams >= MAX_STREAMS_PER_USER) {
      res
        .status(429)
        .json({ success: false, message: "Too many notification streams" });
      return;
    }

    const latest = await prisma.notification.findFirst({
      where: { userId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { id: true, createdAt: true },
    });
    let cursor = latest ? { id: latest.id, createdAt: latest.createdAt } : null;
    let closed = false;
    let polling = false;
    let checks = 0;
    let timer: NodeJS.Timeout | null = null;

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "private, no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    res.write("retry: 5000\n\nevent: sync\ndata: {}\n\n");
    activeStreams.set(userId, openStreams + 1);

    const cleanup = () => {
      if (closed) return;
      closed = true;
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      const remaining = (activeStreams.get(userId) || 1) - 1;
      if (remaining > 0) activeStreams.set(userId, remaining);
      else activeStreams.delete(userId);
      if (!res.writableEnded) res.end();
    };

    res.on("close", cleanup);

    timer = setInterval(() => {
      void (async () => {
        if (closed || polling) return;
        polling = true;
        try {
          if (req.authExpiresAt && Date.now() >= req.authExpiresAt * 1000) {
            cleanup();
            return;
          }
          // Long-lived connections must not survive logout or account removal.
          if (++checks % 10 === 0) {
            const account = await prisma.user.findUnique({
              where: { id: userId },
              select: { deletedAt: true, tokenVersion: true },
            });
            if (
              !account ||
              account.deletedAt ||
              account.tokenVersion !== req.authTokenVersion
            ) {
              cleanup();
              return;
            }
          }

          const items = await prisma.notification.findMany({
            where: {
              userId,
              ...(cursor
                ? {
                    OR: [
                      { createdAt: { gt: cursor.createdAt } },
                      { createdAt: cursor.createdAt, id: { gt: cursor.id } },
                    ],
                  }
                : {}),
            },
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            take: 50,
          });
          for (const item of items) {
            if (closed) break;
            res.write(
              `id: ${item.id}\nevent: notification\ndata: ${JSON.stringify(item)}\n\n`,
            );
            cursor = { id: item.id, createdAt: item.createdAt };
          }
          if (checks % 5 === 0 && !closed) res.write(": heartbeat\n\n");
        } catch (error) {
          console.error("Notification stream failed", error);
          cleanup();
        } finally {
          polling = false;
        }
      })();
    }, 3000);
    if (closed && timer) {
      clearInterval(timer);
      timer = null;
    }
    timer?.unref?.();
  }),
);

export default router;
