import crypto from "crypto";

import type { CreateQrisPaymentInput, CreateQrisPaymentResult, PaymentGateway } from "./payment-gateway";

export class MockQrisProvider implements PaymentGateway {
  async createQrPayment(input: CreateQrisPaymentInput): Promise<CreateQrisPaymentResult> {
    const externalId = `MOCKQR-${input.invoiceNumber}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    return {
      provider: "mock-qris",
      gatewayReference: externalId,
      qrString: `00020101021226610014COM.MOCK.QRIS0118${externalId}5204549953033605802ID5914KOPI KITA MOCK6007JAKARTA6105123456304ABCD`,
      expiredAt: new Date(Date.now() + 15 * 60 * 1000),
    };
  }
}
