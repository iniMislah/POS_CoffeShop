"use client";

import { useCallback, useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { Customer } from "@/lib/types";

export function useCustomers(token: string | null, query = "") {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    if (!token) {
      setCustomers([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const qs = query ? `?q=${encodeURIComponent(query)}` : "";
      const result = await apiClient.get<Customer[]>(`/customers${qs}`, token);
      setCustomers(result);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load customers");
    } finally {
      setIsLoading(false);
    }
  }, [query, token]);

  useEffect(() => {
    void fetchCustomers();
  }, [fetchCustomers]);

  return {
    customers,
    isLoading,
    error,
    refetch: fetchCustomers,
  };
}
