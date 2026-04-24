export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "CASHIER";
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export type ProductVariant = {
  id: string;
  name: string;
  priceDelta: number | string;
};

export type Modifier = {
  id: string;
  name: string;
  price: number | string;
};

export type Product = {
  id: string;
  name: string;
  categoryId: string;
  basePrice: number | string;
  isAvailable: boolean;
  imageUrl?: string | null;
  category?: {
    id: string;
    name: string;
  };
  variants: ProductVariant[];
  modifiers: Modifier[];
};

export type OrderItemModifier = {
  id: string;
  modifierId: string;
  modifierNameSnapshot: string;
  price: number | string;
};

export type OrderItem = {
  id: string;
  productId: string;
  productNameSnapshot: string;
  variantNameSnapshot?: string | null;
  unitPrice: number | string;
  qty: number;
  lineTotal: number | string;
  notes?: string | null;
  modifiers: OrderItemModifier[];
};

export type PaymentTransaction = {
  id: string;
  method: "CASH" | "QRIS";
  status: "PENDING" | "PAID" | "FAILED" | "EXPIRED";
  amount: number | string;
  amountReceived?: number | string | null;
  changeAmount?: number | string | null;
  gatewayProvider?: string | null;
  gatewayReference?: string | null;
  qrString?: string | null;
  expiredAt?: string | null;
  paidAt?: string | null;
  createdAt: string;
};

export type Order = {
  id: string;
  invoiceNumber: string;
  status: "DRAFT" | "PENDING_PAYMENT" | "PAID" | "CANCELLED";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "EXPIRED";
  subtotal: number | string;
  taxAmount: number | string;
  serviceAmount: number | string;
  totalAmount: number | string;
  receiptToken?: string | null;
  paidAt?: string | null;
  createdAt: string;
  cashier?: AuthUser;
  orderItems: OrderItem[];
  paymentTransactions: PaymentTransaction[];
};

export type PaymentStatusResponse = {
  order: Order;
  payment: PaymentTransaction | null;
  receiptUrl?: string | null;
};

export type ReceiptResponse = {
  orderId: string;
  invoiceNumber: string;
  paidAt?: string | null;
  subtotal: number | string;
  taxAmount: number | string;
  serviceAmount: number | string;
  totalAmount: number | string;
  cashier?: {
    id: string;
    name: string;
  };
  items: OrderItem[];
  payments: PaymentTransaction[];
};
