/**
 * useDayDetails Hook
 *
 * Hook zarządzający stanem DayDetails view.
 * Obsługuje ładowanie danych dnia, listy posiłków, usuwanie i edycję.
 */

import { useCallback, useEffect, useState } from "react";
import type { DailyProgressResponseDTO, MealResponseDTO } from "@/types";
import type { DayDetailsState } from "@/types/day-details.types";

type UseDayDetailsParams = {
  date: string; // YYYY-MM-DD
};

type UseDayDetailsReturn = {
  state: DayDetailsState;
  loadDayData: () => Promise<void>;
  deleteMeal: (mealId: string) => Promise<void>;
  refreshAfterMealChange: () => Promise<void>;
  setEditingMeal: (meal: MealResponseDTO | null) => void;
};

/**
 * Pobiera daily progress dla konkretnego dnia
 */
async function fetchDayProgress(date: string): Promise<DailyProgressResponseDTO> {
  const response = await fetch(`/api/v1/daily-progress/${date}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Nie znaleziono danych dla tego dnia");
    }
    if (response.status === 401) {
      throw new Error("Unauthorized - please log in");
    }
    if (response.status === 500) {
      throw new Error("Server error - please try again later");
    }
    throw new Error(`Failed to fetch day progress: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Pobiera listę posiłków dla konkretnego dnia
 */
async function fetchDayMeals(date: string): Promise<MealResponseDTO[]> {
  // API endpoint: GET /api/v1/meals?date=YYYY-MM-DD&limit=100&offset=0
  const response = await fetch(`/api/v1/meals?date=${date}&limit=100&offset=0`);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized - please log in");
    }
    if (response.status === 500) {
      throw new Error("Server error - please try again later");
    }
    throw new Error(`Failed to fetch meals: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data; // PaginatedResponseDTO<MealResponseDTO>
}

/**
 * Usuwa posiłek
 */
async function deleteMealAPI(mealId: string): Promise<void> {
  const response = await fetch(`/api/v1/meals/${mealId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Posiłek nie istnieje");
    }
    if (response.status === 401) {
      throw new Error("Unauthorized - please log in");
    }
    if (response.status === 500) {
      throw new Error("Server error - please try again later");
    }
    throw new Error(`Failed to delete meal: ${response.statusText}`);
  }
}

export function useDayDetails({ date }: UseDayDetailsParams): UseDayDetailsReturn {
  const [state, setState] = useState<DayDetailsState>({
    date,
    progress: null,
    meals: [],
    loading: false,
    error: null,
    deletingMealId: null,
    editingMeal: null,
  });

  /**
   * Ładuje dane dnia (progress + meals)
   */
  const loadDayData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Równoległe pobranie progress i meals
      const [progress, meals] = await Promise.all([fetchDayProgress(date), fetchDayMeals(date)]);

      setState((prev) => ({
        ...prev,
        progress,
        meals,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unknown error",
        loading: false,
      }));
    }
  }, [date]);

  /**
   * Usuwa posiłek
   */
  const deleteMeal = useCallback(
    async (mealId: string) => {
      setState((prev) => ({ ...prev, deletingMealId: mealId }));

      try {
        await deleteMealAPI(mealId);

        // Odśwież dane po usunięciu
        await loadDayData();

        setState((prev) => ({ ...prev, deletingMealId: null }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Unknown error",
          deletingMealId: null,
        }));
      }
    },
    [loadDayData]
  );

  /**
   * Odświeża dane po zmianach w posiłkach (dodanie/edycja)
   */
  const refreshAfterMealChange = useCallback(async () => {
    try {
      const [progress, meals] = await Promise.all([fetchDayProgress(date), fetchDayMeals(date)]);

      setState((prev) => ({
        ...prev,
        progress,
        meals,
      }));
    } catch (error) {
      // Silent fail - nie zmieniamy error state
      console.error("Failed to refresh after meal change:", error);
    }
  }, [date]);

  /**
   * Ustawia posiłek do edycji
   */
  const setEditingMeal = useCallback((meal: MealResponseDTO | null) => {
    setState((prev) => ({ ...prev, editingMeal: meal }));
  }, []);

  /**
   * Load initial data on mount
   */
  useEffect(() => {
    loadDayData();
  }, [loadDayData]);

  return {
    state,
    loadDayData,
    deleteMeal,
    refreshAfterMealChange,
    setEditingMeal,
  };
}
