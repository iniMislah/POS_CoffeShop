"use client";

import { useCallback, useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { Order } from "@/lib/types";
import type { Ingredient } from "./use-inventory";

type DateRange = {
  startDate: string;
  endDate: string;
};

export type SalesSummary = {
  totalOrders: number;
  subtotal: number;
  serviceAmount: number;
  grossSales: number;
  totalSales: number;
};

export type ProductSales = {
  productId: string;
  productName: string;
  qty: number;
  revenue: number;
};

export type PaymentSummary = {
  method: string;
  totalAmount: number;
  count: number;
  paidCount: number;
};

export type StockMovement = {
  id: string;
  type: string;
  qty: number | string;
  createdAt: string;
  ingredient: Ingredient;
};

export function useReports(token: string | null, range: DateRange) {
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [transactions, setTransactions] = useState<Order[]>([]);
  const [productSales, setProductSales] = useState<ProductSales[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = `?startDate=${encodeURIComponent(range.startDate)}&endDate=${encodeURIComponent(range.endDate)}`;

  const fetchReports = useCallback(async () => {
    if (!token || !range.startDate || !range.endDate) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [sales, trx, products, payments, stock] = await Promise.all([
        apiClient.get<SalesSummary>(`/reports/sales-summary${query}`, token),
        apiClient.get<Order[]>(`/reports/transactions${query}`, token),
        apiClient.get<ProductSales[]>(`/reports/products${query}`, token),
        apiClient.get<PaymentSummary[]>(`/reports/payments${query}`, token),
        apiClient.get<StockMovement[]>(`/reports/stock-movements${query}`, token),
      ]);

      setSalesSummary(sales);
      setTransactions(trx);
      setProductSales(products);
      setPaymentSummary(payments);
      setStockMovements(stock);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  }, [query, range.endDate, range.startDate, token]);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  return {
    salesSummary,
    transactions,
    productSales,
    paymentSummary,
    stockMovements,
    isLoading,
    error,
    refetch: fetchReports,
  };
}
