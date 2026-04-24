"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { PaymentStatusResponse } from "@/lib/types";

export function usePaymentStatus({
  token,
  orderId,
  enabled,
  initialData = null,
}: {
  token: string | null;
  orderId: string | null;
  enabled: boolean;
  initialData?: PaymentStatusResponse | null;
}) {
  const [data, setData] = useState<PaymentStatusResponse | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!token || !orderId || !enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.get<PaymentStatusResponse>(`/payments/orders/${orderId}/status`, token);
      setData(result);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load payment status");
    } finally {
      setIsLoading(false);
    }
  }, [token, orderId, enabled]);

  useEffect(() => {
    if (!enabled || !orderId) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }
  }, [enabled, orderId]);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (!enabled || !data?.payment || !orderId || !token) {
      return;
    }

    const status = data.payment.status;
    if (status === "PAID" || status === "EXPIRED" || status === "FAILED") {
      return;
    }

    const interval = window.setInterval(() => {
      void fetchStatus();
    }, 3000);

    return () => {
      window.clearInterval(interval);
    };
  }, [data?.payment, enabled, fetchStatus, orderId, token]);

  const expiresInMs = useMemo(() => {
    const expiredAt = data?.payment?.expiredAt;
    if (!expiredAt) {
      return null;
    }
    return new Date(expiredAt).getTime() - Date.now();
  }, [data?.payment?.expiredAt]);

  return {
    data,
    payment: data?.payment ?? null,
    order: data?.order ?? null,
    receiptUrl: data?.receiptUrl ?? null,
    isLoading,
    error,
    expiresInMs,
    refresh: fetchStatus,
    setData,
  };
}
