import { AppError } from "../../common/app-error";
import { env } from "../../config/env";
import type { CreateQrisPaymentInput, CreateQrisPaymentResult, PaymentGateway } from "./payment-gateway";

export class MidtransPlaceholderProvider implements PaymentGateway {
  async createQrPayment(_input: CreateQrisPaymentInput): Promise<CreateQrisPaymentResult> {
    if (!env.MIDTRANS_SERVER_KEY || !env.MIDTRANS_CLIENT_KEY) {
      throw new AppError("Midtrans keys are not configured. Fill MIDTRANS_SERVER_KEY and MIDTRANS_CLIENT_KEY to continue.", 400);
    }

    throw new AppError("Midtrans integration placeholder is ready, but API request implementation is still TODO before live use.", 501);
  }
}
