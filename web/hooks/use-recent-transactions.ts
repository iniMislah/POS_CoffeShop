"use client";

import { useCallback, useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { Order } from "@/lib/types";

export function useRecentTransactions(token: string | null, limit = 10) {
  const [transactions, setTransactions] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!token) {
      setTransactions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.get<Order[]>(`/orders/recent?limit=${limit}`, token);
      setTransactions(result);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load recent transactions");
    } finally {
      setIsLoading(false);
    }
  }, [limit, token]);

  useEffect(() => {
    void fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    isLoading,
    error,
    refetch: fetchTransactions,
  };
}
