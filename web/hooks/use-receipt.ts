"use client";

import { useCallback, useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { ReceiptResponse } from "@/lib/types";

export function useReceipt(token: string) {
  const [receipt, setReceipt] = useState<ReceiptResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReceipt = useCallback(async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.get<ReceiptResponse>(`/receipts/${token}`);
      setReceipt(result);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load receipt");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchReceipt();
  }, [fetchReceipt]);

  return {
    receipt,
    isLoading,
    error,
    refetch: fetchReceipt,
  };
}
