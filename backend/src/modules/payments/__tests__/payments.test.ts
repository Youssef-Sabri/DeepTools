import { prisma } from "../../../config/database";
import {
  PaymentsService,
  PaymentVerifier,
  VerifiedPayment,
} from "../payments.service";

jest.mock("../../../config/database", () => ({
  prisma: { $transaction: jest.fn(), paymentEvent: { findUnique: jest.fn() } },
}));

const event: VerifiedPayment = {
  provider: "gateway_test",
  eventId: "event-1",
  orderId: "order-1",
  amount: 4900,
  currency: "USD",
  paid: true,
};

function serviceWithVerifier(verified: VerifiedPayment = event) {
  const service = new PaymentsService();
  const verifier: PaymentVerifier = {
    provider: "gateway_test",
    verify: jest.fn().mockResolvedValue(verified),
  };
  service.registerVerifier(verifier);
  return service;
}

describe("payment verification boundary", () => {
  beforeEach(() => jest.clearAllMocks());

  it("fails closed when no provider verifier is installed", async () => {
    await expect(
      new PaymentsService().handleWebhook(
        "gateway_test",
        Buffer.from("{}"),
        {},
      ),
    ).rejects.toMatchObject({ statusCode: 503 });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("does not complete an order when verified amount differs", async () => {
    const tx = {
      paymentEvent: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: "order-1",
          paymentGateway: "gateway_test",
          amount: 5000,
          currency: "USD",
          productId: "product-1",
          fileKey: "uploads/file.zip",
          status: "PENDING",
        }),
        updateMany: jest.fn(),
      },
      license: { create: jest.fn() },
    };
    (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
      callback(tx),
    );
    await expect(
      serviceWithVerifier().handleWebhook(
        "gateway_test",
        Buffer.from("signed"),
        {},
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(tx.order.updateMany).not.toHaveBeenCalled();
    expect(tx.license.create).not.toHaveBeenCalled();
  });

  it("completes an exact paid order and issues one file-bound license atomically", async () => {
    const tx = {
      paymentEvent: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: "order-1",
          userId: "buyer-1",
          productId: "product-1",
          paymentGateway: "gateway_test",
          amount: 4900,
          currency: "USD",
          fileKey: "uploads/file.zip",
          fileMime: "application/zip",
          status: "PENDING",
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      license: { create: jest.fn() },
    };
    (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
      callback(tx),
    );
    const result = await serviceWithVerifier().handleWebhook(
      "gateway_test",
      Buffer.from("signed"),
      {},
    );
    expect(result).toMatchObject({ completed: true, orderId: "order-1" });
    expect(tx.order.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: "COMPLETED", pendingKey: null },
      }),
    );
    expect(tx.license.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "buyer-1",
        productId: "product-1",
        fileKey: "uploads/file.zip",
        expiresAt: null,
      }),
    });
  });
});
