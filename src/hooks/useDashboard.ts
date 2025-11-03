/**
 * useDashboard Hook
 *
 * Główny hook zarządzający stanem Dashboard view.
 * Obsługuje infinite scroll, pull-to-refresh, two-pane layout.
 */

import { useCallback, useEffect, useState } from "react";
import type { DailyProgressResponseDTO } from "@/types";
import type { DashboardState } from "@/types/dashboard.types";
import { PAGINATION_LIMITS } from "@/types/dashboard.types";

interface UseDashboardReturn {
  state: DashboardState;
  loadInitialDays: () => Promise<void>;
  loadMoreDays: () => Promise<void>;
  refreshDays: () => Promise<void>;
  selectDay: (date: string) => void;
  refetchAfterMealChange: () => Promise<void>;
}

/**
 * Pobiera daily progress z API
 */
async function fetchDailyProgress(limit: number, offset: number): Promise<DailyProgressResponseDTO[]> {
  const response = await fetch(`/api/v1/daily-progress?limit=${limit}&offset=${offset}`, {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized - please log in");
    }
    if (response.status === 500) {
      throw new Error("Server error - please try again later");
    }
    throw new Error(`Failed to fetch daily progress: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data; // PaginatedResponseDTO<DailyProgressResponseDTO>
}

export function useDashboard(): UseDashboardReturn {
  const [state, setState] = useState<DashboardState>({
    days: [],
    loading: false,
    error: null,
    hasMore: true,
    offset: 0,
    limit: PAGINATION_LIMITS.DASHBOARD_DAYS_LIMIT,
    selectedDate: null,
    refreshing: false,
    isRefetchingAfterChange: false,
  });

  /**
   * Ładuje początkowe dane
   */
  const loadInitialDays = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const days = await fetchDailyProgress(PAGINATION_LIMITS.DASHBOARD_DAYS_LIMIT, 0);

      setState((prev) => ({
        ...prev,
        days,
        offset: days.length,
        hasMore: days.length >= PAGINATION_LIMITS.DASHBOARD_DAYS_LIMIT,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unknown error",
        loading: false,
      }));
    }
  }, []);

  /**
   * Ładuje więcej dni (infinite scroll)
   */
  const loadMoreDays = useCallback(async () => {
    setState((prev) => {
      if (prev.loading || !prev.hasMore) return prev;
      return { ...prev, loading: true, error: null };
    });

    try {
      const currentState = await new Promise<DashboardState>((resolve) => {
        setState((prev) => {
          resolve(prev);
          return prev;
        });
      });

      const newDays = await fetchDailyProgress(currentState.limit, currentState.offset);

      setState((prev) => ({
        ...prev,
        days: [...prev.days, ...newDays],
        offset: prev.offset + newDays.length,
        hasMore: newDays.length >= prev.limit,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unknown error",
        loading: false,
      }));
    }
  }, []);

  /**
   * Odświeża dane od początku (pull-to-refresh)
   */
  const refreshDays = useCallback(async () => {
    setState((prev) => ({ ...prev, refreshing: true, error: null }));

    try {
      const days = await fetchDailyProgress(PAGINATION_LIMITS.DASHBOARD_DAYS_LIMIT, 0);

      setState((prev) => ({
        ...prev,
        days,
        offset: days.length,
        hasMore: days.length >= PAGINATION_LIMITS.DASHBOARD_DAYS_LIMIT,
        refreshing: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unknown error",
        refreshing: false,
      }));
    }
  }, []);

  /**
   * Wybiera dzień (dla desktop two-pane)
   */
  const selectDay = useCallback((date: string) => {
    setState((prev) => ({ ...prev, selectedDate: date }));
  }, []);

  /**
   * Refetch po zmianach w posiłkach
   * Odświeża dane bez pokazywania loading spinner
   */
  const refetchAfterMealChange = useCallback(async () => {
    console.log("🔄 [useDashboard] refetchAfterMealChange START");
    setState((prev) => {
      console.log("🔄 [useDashboard] Setting isRefetchingAfterChange: true", { prevDaysLength: prev.days.length });
      return { ...prev, isRefetchingAfterChange: true };
    });

    try {
      console.log("🔄 [useDashboard] Fetching daily progress...");
      const days = await fetchDailyProgress(PAGINATION_LIMITS.DASHBOARD_DAYS_LIMIT, 0);
      console.log("✅ [useDashboard] refetchAfterMealChange SUCCESS", { daysReceived: days.length, days });

      setState((prev) => ({
        ...prev,
        days,
        offset: days.length,
        hasMore: days.length >= PAGINATION_LIMITS.DASHBOARD_DAYS_LIMIT,
        isRefetchingAfterChange: false,
      }));
    } catch (error) {
      // Silent fail - nie zmieniamy error state
      console.error("❌ [useDashboard] Failed to refetch after meal change:", error);
      setState((prev) => ({ ...prev, isRefetchingAfterChange: false }));
    }
  }, []);

  /**
   * Load initial data on mount
   */
  useEffect(() => {
    loadInitialDays();
  }, [loadInitialDays]);

  return {
    state,
    loadInitialDays,
    loadMoreDays,
    refreshDays,
    selectDay,
    refetchAfterMealChange,
  };
}
