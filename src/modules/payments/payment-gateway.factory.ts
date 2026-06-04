import { env } from "../../config/env";
import type { PaymentGateway } from "./payment-gateway";
import { MidtransPlaceholderProvider } from "./midtrans.provider";
import { MockQrisProvider } from "./mock-qris.provider";

// QRIS checkout currently uses manual cashier confirmation; this factory is not part of the active payment flow.
export function getPaymentGateway(): PaymentGateway {
  if (env.PAYMENT_GATEWAY_NAME === "midtrans") {
    return new MidtransPlaceholderProvider();
  }

  return new MockQrisProvider();
}
