export type SummaryMetric = {
  title: string;
  value: string;
  hint: string;
  trend: string;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  image: string;
  available: boolean;
  variants: string[];
  modifiers: string[];
};

export type InventoryItem = {
  id: string;
  name: string;
  unit: string;
  stock: number;
  minimumStock: number;
  costPerUnit: number;
  status: "Healthy" | "Low";
};

export type Transaction = {
  id: string;
  invoice: string;
  customer: string;
  total: number;
  status: "paid" | "pending" | "cancelled";
  paymentMethod: "cash" | "qris";
  createdAt: string;
  items: { name: string; qty: number; price: number }[];
};

export type PaymentRecord = {
  id: string;
  invoice: string;
  method: "cash" | "qris";
  amount: number;
  status: "pending" | "paid" | "failed" | "expired";
  gatewayReference: string;
  createdAt: string;
};

export const sidebarNavigation: Array<{
  title: string;
  href: string;
  roles: AuthUser["role"][];
}> = [
  { title: "Dashboard", href: "/", roles: ["ADMIN"] },
  { title: "POS / Cashier", href: "/pos", roles: ["ADMIN", "CASHIER"] },
  { title: "Menu Management", href: "/menu-management", roles: ["ADMIN"] },
  { title: "Categories", href: "/categories", roles: ["ADMIN"] },
  { title: "Customers", href: "/customers", roles: ["ADMIN"] },
  { title: "Inventory", href: "/inventory", roles: ["ADMIN"] },
  { title: "Transactions", href: "/transactions", roles: ["ADMIN", "CASHIER"] },
  { title: "Payments", href: "/payments", roles: ["ADMIN"] },
  { title: "Reports", href: "/reports", roles: ["ADMIN"] },
  { title: "Settings", href: "/settings", roles: ["ADMIN"] },
];

export const dashboardMetrics: SummaryMetric[] = [
  { title: "Total Sales Today", value: "Rp 8.450.000", hint: "vs yesterday +12.4%", trend: "+12%" },
  { title: "Total Orders", value: "186", hint: "17 drafts still open", trend: "+24" },
  { title: "Pending Payments", value: "9", hint: "5 QRIS awaiting callback", trend: "Needs follow-up" },
  { title: "Low Stock", value: "6", hint: "2 items critically low", trend: "Restock soon" },
];

export const topSellingMenus = [
  { name: "Iced Aren Latte", sold: 72, revenue: 1944000 },
  { name: "Cappuccino", sold: 55, revenue: 1430000 },
  { name: "Croissant Butter", sold: 38, revenue: 684000 },
  { name: "Matcha Latte", sold: 29, revenue: 812000 },
];

export const products: Product[] = [
  {
    id: "prd-1",
    name: "Iced Aren Latte",
    category: "Coffee",
    basePrice: 27000,
    image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80",
    available: true,
    variants: ["Regular", "Large"],
    modifiers: ["Extra Shot", "Oat Milk"],
  },
  {
    id: "prd-2",
    name: "Cappuccino",
    category: "Coffee",
    basePrice: 26000,
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
    available: true,
    variants: ["Hot", "Iced"],
    modifiers: ["Extra Foam", "Extra Shot"],
  },
  {
    id: "prd-3",
    name: "Matcha Latte",
    category: "Non Coffee",
    basePrice: 28000,
    image: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=800&q=80",
    available: true,
    variants: ["Regular", "Large"],
    modifiers: ["Oat Milk", "Less Ice"],
  },
  {
    id: "prd-4",
    name: "Croissant Butter",
    category: "Pastry",
    basePrice: 18000,
    image: "https://images.unsplash.com/photo-1555507036-ab794f4afe5a?auto=format&fit=crop&w=800&q=80",
    available: false,
    variants: [],
    modifiers: ["Cheese Add-on"],
  },
  {
    id: "prd-5",
    name: "Spanish Latte",
    category: "Coffee",
    basePrice: 30000,
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
    available: true,
    variants: ["Hot", "Iced"],
    modifiers: ["Extra Shot", "Cream Top"],
  },
  {
    id: "prd-6",
    name: "Sparkling Yuzu",
    category: "Signature",
    basePrice: 32000,
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80",
    available: true,
    variants: ["Regular"],
    modifiers: ["Less Sugar"],
  },
];

export const categories = ["All", "Coffee", "Non Coffee", "Pastry", "Signature"];

export const inventoryItems: InventoryItem[] = [
  { id: "ing-1", name: "Arabica Beans", unit: "gram", stock: 6200, minimumStock: 2500, costPerUnit: 1.8, status: "Healthy" },
  { id: "ing-2", name: "Fresh Milk", unit: "ml", stock: 1800, minimumStock: 2000, costPerUnit: 0.04, status: "Low" },
  { id: "ing-3", name: "Palm Sugar Syrup", unit: "ml", stock: 750, minimumStock: 900, costPerUnit: 0.06, status: "Low" },
  { id: "ing-4", name: "Matcha Powder", unit: "gram", stock: 1200, minimumStock: 500, costPerUnit: 2.2, status: "Healthy" },
  { id: "ing-5", name: "Croissant Dough", unit: "pcs", stock: 40, minimumStock: 18, costPerUnit: 8500, status: "Healthy" },
];

export const transactions: Transaction[] = [
  {
    id: "trx-1",
    invoice: "INV-20260423-090201-A1",
    customer: "Walk-in Customer",
    total: 54000,
    status: "paid",
    paymentMethod: "cash",
    createdAt: "2026-04-23T09:02:00.000Z",
    items: [
      { name: "Iced Aren Latte", qty: 1, price: 27000 },
      { name: "Croissant Butter", qty: 1, price: 27000 },
    ],
  },
  {
    id: "trx-2",
    invoice: "INV-20260423-101200-B2",
    customer: "Office Group",
    total: 148000,
    status: "pending",
    paymentMethod: "qris",
    createdAt: "2026-04-23T10:12:00.000Z",
    items: [
      { name: "Cappuccino", qty: 2, price: 26000 },
      { name: "Spanish Latte", qty: 2, price: 30000 },
      { name: "Matcha Latte", qty: 1, price: 28000 },
    ],
  },
  {
    id: "trx-3",
    invoice: "INV-20260423-111030-C3",
    customer: "Maya S.",
    total: 32000,
    status: "paid",
    paymentMethod: "qris",
    createdAt: "2026-04-23T11:10:00.000Z",
    items: [{ name: "Sparkling Yuzu", qty: 1, price: 32000 }],
  },
];

export const payments: PaymentRecord[] = [
  { id: "pay-1", invoice: "INV-20260423-090201-A1", method: "cash", amount: 54000, status: "paid", gatewayReference: "-", createdAt: "2026-04-23T09:03:00.000Z" },
  { id: "pay-2", invoice: "INV-20260423-101200-B2", method: "qris", amount: 148000, status: "pending", gatewayReference: "MOCKQR-2A91F", createdAt: "2026-04-23T10:13:00.000Z" },
  { id: "pay-3", invoice: "INV-20260423-111030-C3", method: "qris", amount: 32000, status: "paid", gatewayReference: "MOCKQR-1B73A", createdAt: "2026-04-23T11:12:00.000Z" },
  { id: "pay-4", invoice: "INV-20260422-185500-K2", method: "qris", amount: 87000, status: "expired", gatewayReference: "MOCKQR-9X01Z", createdAt: "2026-04-22T18:55:00.000Z" },
];

export const reportCards = [
  { title: "Gross Sales", value: "Rp 22.480.000", description: "Last 7 days" },
  { title: "Average Order", value: "Rp 41.300", description: "Across 544 transactions" },
  { title: "Cash Ratio", value: "38%", description: "Cash vs total paid orders" },
  { title: "COGS Estimate", value: "Rp 8.930.000", description: "Based on recipe usage" },
];

export const recentTransactions = transactions;

export const receiptDetail = {
  storeName: "Kopi Kita Signature",
  invoiceNumber: "INV-20260423-111030-C3",
  date: "2026-04-23T11:12:00.000Z",
  items: [
    { name: "Sparkling Yuzu", qty: 1, price: 32000 },
    { name: "Oat Milk Add-on", qty: 1, price: 6000 },
  ],
  subtotal: 38000,
  tax: 3800,
  service: 2000,
  total: 43800,
  paymentMethod: "QRIS",
  status: "Paid",
};
import type { AuthUser } from "@/lib/types";
