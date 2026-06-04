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
  isActive?: boolean;
};

type IngredientPayload = {
  name: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  costPerUnit: number;
  note?: string;
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

  useEffect(() => {
    if (!token) {
      return;
    }

    const handleFocus = () => {
      if (document.visibilityState === "hidden") {
        return;
      }
      void fetchIngredients();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [fetchIngredients, token]);

  const createIngredient = async (payload: IngredientPayload) => {
    if (!token) {
      throw new Error("Unauthorized");
    }
    await apiClient.post("/ingredients", payload, token);
    await fetchIngredients();
  };

  const updateIngredient = async (ingredientId: string, payload: Omit<IngredientPayload, "note">) => {
    if (!token) {
      throw new Error("Unauthorized");
    }
    await apiClient.put(`/ingredients/${ingredientId}`, payload, token);
    await fetchIngredients();
  };

  const deleteIngredient = async (ingredientId: string) => {
    if (!token) {
      throw new Error("Unauthorized");
    }
    const result = await apiClient.delete<{ mode: "soft-delete" | "hard-delete" }>(`/ingredients/${ingredientId}`, token);
    await fetchIngredients();
    return result;
  };

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
    createIngredient,
    updateIngredient,
    deleteIngredient,
    stockIn,
    adjustStock,
  };
}
