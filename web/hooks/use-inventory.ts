"use client";

import { useCallback, useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";

export type Ingredient = {
  id: string;
  name: string;
  unit: string;
  currentStock: number | string;
  minimumStock: number | string;
  costPerUnit: number | string;
};

export function useInventory(token: string | null) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIngredients = useCallback(async () => {
    if (!token) {
      setIngredients([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.get<Ingredient[]>("/ingredients", token);
      setIngredients(result);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load ingredients");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchIngredients();
  }, [fetchIngredients]);

  const stockIn = async (ingredientId: string, qty: number, note?: string) => {
    if (!token) {
      throw new Error("Unauthorized");
    }
    await apiClient.post("/inventory/stock-in", { ingredientId, qty, note }, token);
    await fetchIngredients();
  };

  const adjustStock = async (ingredientId: string, newStock: number, note?: string) => {
    if (!token) {
      throw new Error("Unauthorized");
    }
    await apiClient.post("/inventory/adjustment", { ingredientId, newStock, note }, token);
    await fetchIngredients();
  };

  return {
    ingredients,
    isLoading,
    error,
    refetch: fetchIngredients,
    stockIn,
    adjustStock,
  };
}
