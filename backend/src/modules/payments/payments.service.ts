import { IncomingHttpHeaders } from "http";
import { ApiError } from "../../utils/apiError";
import { PaymentsRepository, paymentsRepository } from "./payments.repository";

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
  verify(
    rawBody: Buffer,
    headers: IncomingHttpHeaders,
  ): Promise<VerifiedPayment>;
}

export class PaymentsService {
  private readonly verifiers = new Map<string, PaymentVerifier>();

  constructor(private readonly repo: PaymentsRepository = paymentsRepository) {}

  registerVerifier(verifier: PaymentVerifier) {
    if (!/^[a-z0-9_-]{2,50}$/.test(verifier.provider))
      throw ApiError.badRequest("Invalid payment provider");
    if (this.verifiers.has(verifier.provider))
      throw ApiError.conflict("Payment verifier already registered");
    this.verifiers.set(verifier.provider, verifier);
  }

  async handleWebhook(
    provider: string,
    rawBody: Buffer,
    headers: IncomingHttpHeaders,
  ) {
    const verifier = this.verifiers.get(provider);
    if (!verifier)
      throw new ApiError(503, "Payment verifier is not configured");
    if (!Buffer.isBuffer(rawBody) || rawBody.length === 0)
      throw ApiError.badRequest("Webhook body is required");
    const event = await verifier.verify(rawBody, headers);
    if (
      event.provider !== provider ||
      !event.eventId ||
      !event.orderId ||
      !Number.isSafeInteger(event.amount) ||
      event.amount < 0 ||
      !/^[A-Z]{3}$/.test(event.currency)
    ) {
      throw ApiError.badRequest("Invalid verified payment event");
    }
    if (!event.paid) return { accepted: true, completed: false };
    return this.repo.completeOrderPayment(event);
  }
}

export const paymentsService = new PaymentsService();
