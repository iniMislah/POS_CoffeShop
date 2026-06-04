"use client";

import { useCallback, useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";

export type PaymentListItem = {
  id: string;
  method: "CASH" | "QRIS";
  status: "PENDING" | "PAID" | "FAILED" | "EXPIRED";
  amount: number | string;
  grossAmount?: number | string | null;
  gatewayProvider?: string | null;
  gatewayReference?: string | null;
  transactionId?: string | null;
  midtransOrderId?: string | null;
  snapToken?: string | null;
  redirectUrl?: string | null;
  paidAt?: string | null;
  createdAt: string;
  order: {
    id: string;
    invoiceNumber: string;
    receiptToken?: string | null;
  };
};

export function usePayments(token: string | null) {
  const [payments, setPayments] = useState<PaymentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    if (!token) {
      setPayments([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.get<PaymentListItem[]>("/payments", token);
      setPayments(result);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load payments");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchPayments();
  }, [fetchPayments]);

  return {
    payments,
    isLoading,
    error,
    refetch: fetchPayments,
  };
}
