"use client";

import { useCallback, useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { Product } from "@/lib/types";

export function useProducts(token: string | null) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!token) {
      setProducts([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.get<Product[]>("/products", token);
      setProducts(result);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load products");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    isLoading,
    error,
    refetch: fetchProducts,
  };
}
