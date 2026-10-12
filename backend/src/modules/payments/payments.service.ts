import crypto from "crypto";
import { IncomingHttpHeaders } from "http";
import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import { ApiError } from "../../utils/apiError";

export interface VerifiedPayment {
  provider: string;
  eventId: string;
  orderId: string;
  amount: number; // smallest currency unit, matching Order.amount
  currency: string;
  paid: boolean;
}

export interface PaymentVerifier {
  readonly provider: string;
  // Implementations must authenticate the raw bytes and check timestamp/replay
  // rules before returning a normalized event. Never trust caller-supplied JSON.
  verify(rawBody: Buffer, headers: IncomingHttpHeaders): Promise<VerifiedPayment>;
}

export class PaymentsService {
  private readonly verifiers = new Map<string, PaymentVerifier>();

  registerVerifier(verifier: PaymentVerifier) {
    if (!/^[a-z0-9_-]{2,50}$/.test(verifier.provider)) throw ApiError.badRequest("Invalid payment provider");
    if (this.verifiers.has(verifier.provider)) throw ApiError.conflict("Payment verifier already registered");
    this.verifiers.set(verifier.provider, verifier);
  }

  async handleWebhook(provider: string, rawBody: Buffer, headers: IncomingHttpHeaders) {
    const verifier = this.verifiers.get(provider);
    if (!verifier) throw new ApiError(503, "Payment verifier is not configured");
    if (!Buffer.isBuffer(rawBody) || rawBody.length === 0) throw ApiError.badRequest("Webhook body is required");
    const event = await verifier.verify(rawBody, headers);
    if (event.provider !== provider || !event.eventId || !event.orderId ||
        !Number.isSafeInteger(event.amount) || event.amount < 0 || !/^[A-Z]{3}$/.test(event.currency)) {
      throw ApiError.badRequest("Invalid verified payment event");
    }
    if (!event.paid) return { accepted: true, completed: false };
    return this.completeVerifiedPayment(event);
  }

  private async completeVerifiedPayment(event: VerifiedPayment) {
    try {
      return await prisma.$transaction(async (tx) => {
        const prior = await tx.paymentEvent.findUnique({
          where: { gateway_eventId: { gateway: event.provider, eventId: event.eventId } },
        });
        if (prior) {
          if (prior.orderId !== event.orderId) throw ApiError.conflict("Payment event was already used");
          return { accepted: true, completed: true, orderId: prior.orderId };
        }

        const order = await tx.order.findUnique({ where: { id: event.orderId } });
        if (!order || order.paymentGateway !== event.provider || order.amount !== event.amount ||
            order.currency !== event.currency || !order.productId || !order.fileKey) {
          throw ApiError.badRequest("Payment does not match a payable order");
        }
        if (order.status !== OrderStatus.PENDING) throw ApiError.conflict("Order is not pending");

        await tx.paymentEvent.create({ data: {
          gateway: event.provider, eventId: event.eventId, orderId: order.id,
        } });
        const claimed = await tx.order.updateMany({
          where: { id: order.id, status: OrderStatus.PENDING, paymentGateway: event.provider },
          data: { status: OrderStatus.COMPLETED, pendingKey: null },
        });
        if (claimed.count !== 1) throw ApiError.conflict("Order is no longer pending");
        const licenseKey = `DF-${crypto.randomBytes(18).toString("hex").toUpperCase()}`;
        await tx.license.create({ data: {
          userId: order.userId,
          productId: order.productId,
          licenseKey,
          fileKey: order.fileKey,
          fileMime: order.fileMime,
          expiresAt: null,
        } });
        return { accepted: true, completed: true, orderId: order.id };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const prior = await prisma.paymentEvent.findUnique({
          where: { gateway_eventId: { gateway: event.provider, eventId: event.eventId } },
        });
        if (prior?.orderId === event.orderId) return { accepted: true, completed: true, orderId: prior.orderId };
      }
      throw error;
    }
  }
}

export const paymentsService = new PaymentsService();
