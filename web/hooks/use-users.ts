"use client";

import { useCallback, useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { UserManagementUser } from "@/lib/types";

export function useUsers(token?: string | null) {
  const [users, setUsers] = useState<UserManagementUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!token) {
      setUsers([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.get<UserManagementUser[]>("/users", token);
      setUsers(data);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to load users.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    isLoading,
    error,
    refetch: fetchUsers,
  };
}
