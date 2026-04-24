"use client";

import { useCallback, useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";

export type Category = {
  id: string;
  name: string;
};

export function useCategories(token: string | null) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!token) {
      setCategories([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.get<Category[]>("/categories", token);
      setCategories(result);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    isLoading,
    error,
    refetch: fetchCategories,
  };
}
