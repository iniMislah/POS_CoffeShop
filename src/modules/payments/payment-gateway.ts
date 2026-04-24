export type CreateQrisPaymentInput = {
  orderId: string;
  amount: number;
  invoiceNumber: string;
};

export type CreateQrisPaymentResult = {
  provider: string;
  gatewayReference: string;
  qrString: string;
  expiredAt: Date;
};

export interface PaymentGateway {
  createQrPayment(input: CreateQrisPaymentInput): Promise<CreateQrisPaymentResult>;
}
