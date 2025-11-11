/**
 * Calorie Goal Service
 * Centralized API calls for calorie goal operations
 */

import type { CalorieGoalResponseDTO, CreateCalorieGoalRequestDTO, ErrorResponseDTO } from "@/types";

/**
 * Helper function to get tomorrow's date in YYYY-MM-DD format
 */
function getTomorrowDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD
}

/**
 * Helper function to handle API errors
 */
function handleApiError(response: Response, errorData: ErrorResponseDTO): Error {
  // Extract validation error details
  const errorMessage = errorData.details
    ? Object.values(errorData.details).join(", ")
    : errorData.message || "Błąd podczas operacji";

  return new Error(errorMessage);
}

/**
 * Calorie Goal API client
 */
export const calorieGoalService = {
  /**
   * Get calorie goal by date
   * @throws Error if goal not found or API error
   */
  async getGoalByDate(date: string): Promise<CalorieGoalResponseDTO> {
    const response = await fetch(`/api/v1/calorie-goals/by-date?date=${date}`);

    if (response.status === 404) {
      throw new Error("Goal not found");
    }

    if (!response.ok) {
      throw new Error("Nie udało się pobrać celu kalorycznego");
    }

    return response.json();
  },

  /**
   * Create new calorie goal
   * @throws Error with user-friendly message
   */
  async createGoal(data: CreateCalorieGoalRequestDTO): Promise<CalorieGoalResponseDTO> {
    const response = await fetch("/api/v1/calorie-goals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.status === 400) {
      const errorData: ErrorResponseDTO = await response.json();
      throw handleApiError(response, errorData);
    }

    if (response.status === 409) {
      throw new Error("Cel na jutro został już utworzony. Odśwież stronę i spróbuj ponownie.");
    }

    if (response.status === 500) {
      throw new Error("Wystąpił błąd serwera. Spróbuj ponownie później.");
    }

    if (!response.ok) {
      throw new Error(`Nieoczekiwany błąd: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Update existing calorie goal
   * @throws Error with user-friendly message
   */
  async updateGoal(id: string, data: CreateCalorieGoalRequestDTO): Promise<CalorieGoalResponseDTO> {
    const response = await fetch(`/api/v1/calorie-goals/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.status === 400) {
      const errorData: ErrorResponseDTO = await response.json();
      throw handleApiError(response, errorData);
    }

    if (response.status === 404) {
      throw new Error("Cel został usunięty. Odśwież stronę i spróbuj ponownie.");
    }

    if (response.status === 500) {
      throw new Error("Wystąpił błąd serwera. Spróbuj ponownie później.");
    }

    if (!response.ok) {
      throw new Error(`Nieoczekiwany błąd: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Save goal for tomorrow - handles complex POST vs PATCH logic
   *
   * Logika (zapewniająca niemutowalność użytych celów):
   * 1. Sprawdza czy cel na jutro już istnieje (GET /by-date?date=tomorrow)
   * 2. Jeśli NIE istnieje → POST (utwórz nowy cel)
   * 3. Jeśli istnieje i jest niemutowalny (effective_from <= dzisiaj) → POST (utwórz nowy cel na jutro)
   * 4. Jeśli istnieje i NIE jest niemutowalny (effective_from > dzisiaj) → PATCH (aktualizuj istniejący)
   *
   * Niemutowalność gwarantuje, że cele użyte w daily_progress nie są modyfikowane,
   * zachowując integralność historycznych danych.
   *
   * @throws Error with user-friendly message
   */
  async saveGoalForTomorrow(dailyGoal: number): Promise<CalorieGoalResponseDTO> {
    try {
      const tomorrow = getTomorrowDate();

      // Step 1: Check if goal for tomorrow already exists
      let existingGoal: (CalorieGoalResponseDTO & { is_immutable?: boolean }) | null = null;

      try {
        existingGoal = await this.getGoalByDate(tomorrow);
      } catch (error) {
        // Goal doesn't exist (404) - that's ok, we'll create it
        if (error instanceof Error && error.message === "Goal not found") {
          existingGoal = null;
        } else {
          // Other error - re-throw
          throw new Error("Nie udało się sprawdzić istniejącego celu. Spróbuj ponownie.");
        }
      }

      const goalData: CreateCalorieGoalRequestDTO = {
        daily_goal: dailyGoal,
      };

      // Step 2: Decide whether to POST or PATCH
      if (!existingGoal) {
        // Goal doesn't exist - create new
        return await this.createGoal(goalData);
      }

      if (existingGoal.is_immutable) {
        // Goal is immutable (already started/used) - create new goal with POST
        // This ensures we don't modify goals that are already in use
        return await this.createGoal(goalData);
      }

      // Goal is mutable (not started yet) - safe to update with PATCH
      return await this.updateGoal(existingGoal.id, goalData);
    } catch (error) {
      // If it's already our custom error, re-throw
      if (error instanceof Error) {
        throw error;
      }

      // Network error or other unexpected error
      throw new Error("Błąd połączenia. Sprawdź internet i spróbuj ponownie.");
    }
  },
};
