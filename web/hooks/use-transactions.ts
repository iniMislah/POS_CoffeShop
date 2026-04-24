"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { Order } from "@/lib/types";

type Filters = {
  status: string;
  paymentMethod: string;
  date: string;
};

export function useTransactions(token: string | null, filters: Filters) {
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
      const result = await apiClient.get<Order[]>("/orders", token);
      setTransactions(result);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load transactions");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchTransactions();
  }, [fetchTransactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesStatus =
        filters.status === "all" || transaction.status.toLowerCase() === filters.status.toLowerCase();
      const latestPayment = transaction.paymentTransactions[0];
      const matchesMethod =
        filters.paymentMethod === "all" ||
        latestPayment?.method.toLowerCase() === filters.paymentMethod.toLowerCase();
      const matchesDate =
        !filters.date || transaction.createdAt.slice(0, 10) === filters.date;

      return matchesStatus && matchesMethod && matchesDate;
    });
  }, [filters.date, filters.paymentMethod, filters.status, transactions]);

  return {
    transactions: filteredTransactions,
    isLoading,
    error,
    refetch: fetchTransactions,
  };
}
