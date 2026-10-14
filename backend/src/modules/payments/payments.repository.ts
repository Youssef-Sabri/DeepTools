import crypto from "crypto";
import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import { ApiError } from "../../utils/apiError";
import { VerifiedPayment } from "./payments.service";

export class PaymentsRepository {
  async completeOrderPayment(event: VerifiedPayment) {
    try {
      return await prisma.$transaction(async (tx) => {
        const prior = await tx.paymentEvent.findUnique({
          where: {
            gateway_eventId: {
              gateway: event.provider,
              eventId: event.eventId,
            },
          },
        });
        if (prior) {
          if (prior.orderId !== event.orderId)
            throw ApiError.conflict("Payment event was already used");
          return { accepted: true, completed: true, orderId: prior.orderId };
        }

        const order = await tx.order.findUnique({
          where: { id: event.orderId },
        });
        if (
          !order ||
          order.paymentGateway !== event.provider ||
          order.amount !== event.amount ||
          order.currency !== event.currency ||
          !order.productId ||
          !order.fileKey
        ) {
          throw ApiError.badRequest("Payment does not match a payable order");
        }
        if (order.status !== OrderStatus.PENDING)
          throw ApiError.conflict("Order is not pending");

        await tx.paymentEvent.create({
          data: {
            gateway: event.provider,
            eventId: event.eventId,
            orderId: order.id,
          },
        });
        const claimed = await tx.order.updateMany({
          where: {
            id: order.id,
            status: OrderStatus.PENDING,
            paymentGateway: event.provider,
          },
          data: { status: OrderStatus.COMPLETED, pendingKey: null },
        });
        if (claimed.count !== 1)
          throw ApiError.conflict("Order is no longer pending");
        const licenseKey = `DF-${crypto.randomBytes(18).toString("hex").toUpperCase()}`;
        await tx.license.create({
          data: {
            userId: order.userId,
            productId: order.productId,
            licenseKey,
            fileKey: order.fileKey,
            fileMime: order.fileMime,
            expiresAt: null,
          },
        });
        return { accepted: true, completed: true, orderId: order.id };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const prior = await prisma.paymentEvent.findUnique({
          where: {
            gateway_eventId: {
              gateway: event.provider,
              eventId: event.eventId,
            },
          },
        });
        if (prior?.orderId === event.orderId)
          return { accepted: true, completed: true, orderId: prior.orderId };
      }
      throw error;
    }
  }
}

export const paymentsRepository = new PaymentsRepository();
