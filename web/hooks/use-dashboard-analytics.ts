"use client";

import { useCallback, useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { DashboardPeriod, DashboardSummary, TopProductMetric } from "@/lib/types";

export function useDashboardAnalytics(token: string | null, period: DashboardPeriod) {
  const [topProducts, setTopProducts] = useState<TopProductMetric[]>([]);
  const [topRevenueProducts, setTopRevenueProducts] = useState<TopProductMetric[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!token) {
      setTopProducts([]);
      setTopRevenueProducts([]);
      setSummary(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const query = `period=${period}`;
      const nextSummary = await apiClient
        .get<DashboardSummary>(`/dashboard/summary?${query}`, token)
        .catch(() => null);
      const productsResult = await apiClient
        .get<TopProductMetric[]>(`/dashboard/top-products?${query}`, token)
        .catch((error: Error) => error);
      const revenueProductsResult = await apiClient
        .get<TopProductMetric[]>(`/dashboard/top-revenue-products?${query}`, token)
        .catch((error: Error) => error);

      const analyticsError =
        productsResult instanceof Error
          ? productsResult
          : revenueProductsResult instanceof Error
          ? revenueProductsResult
          : null;

      setSummary(nextSummary);
      setTopProducts(productsResult instanceof Error ? [] : productsResult);
      setTopRevenueProducts(revenueProductsResult instanceof Error ? [] : revenueProductsResult);

      const message = analyticsError?.message.toLowerCase() ?? "";
      if (analyticsError && !message.includes("route not found") && !message.includes("validation failed")) {
        setError(analyticsError.message);
      }
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load sales analytics");
    } finally {
      setIsLoading(false);
    }
  }, [period, token]);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    topProducts,
    topRevenueProducts,
    summary,
    isLoading,
    error,
    refetch: fetchAnalytics,
  };
}
