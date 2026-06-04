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
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export type Customer = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  totalTransactions?: number;
  totalSpend?: number;
  averageTransactionValue?: number;
  lastTransaction?: string | null;
  favoriteProduct?: string | null;
  recentOrders?: Order[];
  createdAt: string;
  updatedAt: string;
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
  deletedAt?: string | null;
  category?: {
    id: string;
    name: string;
  };
  variants: ProductVariant[];
  modifiers: Modifier[];
};

export type RecipeItem = {
  id: string;
  ingredientId: string;
  qtyUsed: number | string;
  ingredient: {
    id: string;
    name: string;
    unit: string;
    currentStock: number | string;
    minimumStock: number | string;
    costPerUnit: number | string;
  };
};

export type Recipe = {
  id: string;
  productId: string;
  variantId?: string | null;
  recipeItems: RecipeItem[];
};

export type PosProduct = Omit<Product, "basePrice" | "variants" | "modifiers"> & {
  basePrice: number;
  variants: Array<{
    id: string;
    name: string;
    priceDelta: number;
  }>;
  modifiers: Array<{
    id: string;
    name: string;
    price: number;
  }>;
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
  grossAmount?: number | string | null;
  amountReceived?: number | string | null;
  changeAmount?: number | string | null;
  gatewayProvider?: string | null;
  gatewayReference?: string | null;
  transactionId?: string | null;
  midtransOrderId?: string | null;
  snapToken?: string | null;
  redirectUrl?: string | null;
  qrString?: string | null;
  expiredAt?: string | null;
  paidAt?: string | null;
  createdAt: string;
};

export type Order = {
  id: string;
  invoiceNumber: string;
  customerId?: string | null;
  customerNameSnapshot?: string | null;
  status: "DRAFT" | "PENDING_PAYMENT" | "PAID" | "CANCELLED";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "EXPIRED";
  subtotal: number | string;
  serviceAmount: number | string;
  totalAmount: number | string;
  receiptToken?: string | null;
  paidAt?: string | null;
  createdAt: string;
  cashier?: AuthUser;
  customer?: {
    id: string;
    name: string;
    phone?: string | null;
  } | null;
  orderItems: OrderItem[];
  paymentTransactions: PaymentTransaction[];
};

export type PaymentStatusResponse = {
  order: Order;
  payment: PaymentTransaction | null;
  receiptUrl?: string | null;
};

export type ReceiptResponse = {
  invoiceNumber: string;
  receiptToken?: string | null;
  receiptUrl?: string | null;
  pdfUrl?: string | null;
  paidAt?: string | null;
  createdAt: string;
  subtotal: number | string;
  serviceAmount: number | string;
  totalAmount: number | string;
  paymentStatus: Order["paymentStatus"];
  orderStatus: Order["status"];
  cashier?: {
    id: string;
    name: string;
  };
  customerName?: string;
  payment?: {
    method: PaymentTransaction["method"];
    status: PaymentTransaction["status"];
    amountReceived?: number | string | null;
    changeAmount?: number | string | null;
    paidAt?: string | null;
    gatewayReference?: string | null;
  } | null;
  items: Array<{
    id: string;
    productNameSnapshot: string;
    variantNameSnapshot?: string | null;
    unitPrice: number | string;
    qty: number;
    notes?: string | null;
    lineTotal: number | string;
    modifiers: Array<{
      id: string;
      modifierNameSnapshot: string;
      price: number | string;
    }>;
  }>;
};

export type ReceiptQrResponse = {
  orderId: string;
  invoiceNumber: string;
  receiptToken?: string | null;
  receiptUrl: string;
  pdfUrl: string;
  qrCodeDataUrl: string;
};

export type DashboardPeriod =
  | "today"
  | "last-1-week"
  | "last-1-month"
  | "last-3-months"
  | "all-time";

export type TopProductMetric = {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
};

export type DashboardSummary = {
  salesToday: number;
  paidOrdersToday: number;
  successPaymentsToday: number;
  pendingPayments: number;
  totalOrders: number;
};

export type SalesTrendPoint = {
  label: string;
  totalSales: number;
  orderCount: number;
};

export type UserManagementUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "CASHIER";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
