/**
 * useCalorieGoalForm Hook
 *
 * Hook zarządzający stanem formularza edycji celu kalorycznego.
 * Obsługuje walidację, submit do API, i obsługę błędów.
 */

import { useState, useCallback, useEffect } from "react";
import type { EditCalorieGoalViewModel } from "@/types/settings.types";
import type { CalorieGoalResponseDTO, CreateCalorieGoalRequestDTO, ErrorResponseDTO } from "@/types";

// Stałe walidacji (zgodne z backendem - createCalorieGoalSchema)
const VALIDATION_LIMITS = {
  MIN_GOAL: 1,
  MAX_GOAL: 10000,
};

type UseCalorieGoalFormReturn = {
  state: EditCalorieGoalViewModel;
  updateGoalValue: (value: string) => void;
  validateField: () => boolean;
  submitGoal: () => Promise<CalorieGoalResponseDTO>;
  reset: () => void;
};

/**
 * Tworzy początkowy stan formularza
 */
function getInitialState(currentGoal: CalorieGoalResponseDTO | null): EditCalorieGoalViewModel {
  return {
    goalValue: currentGoal?.daily_goal?.toString() || "",
    isSaving: false,
    validationError: null,
    apiError: null,
  };
}

/**
 * Walidacja pola goal value
 * @returns true jeśli walidacja przeszła pomyślnie
 */
function validateGoalValue(value: string): {
  valid: boolean;
  error: string | null;
} {
  // Check if empty
  if (!value.trim()) {
    return {
      valid: false,
      error: "Cel kaloryczny jest wymagany",
    };
  }

  // Check if valid number
  const numValue = Number(value);
  if (isNaN(numValue)) {
    return {
      valid: false,
      error: "Cel musi być liczbą",
    };
  }

  // Check if integer
  if (!Number.isInteger(numValue)) {
    return {
      valid: false,
      error: "Cel musi być liczbą całkowitą",
    };
  }

  // Check range
  if (numValue < VALIDATION_LIMITS.MIN_GOAL) {
    return {
      valid: false,
      error: `Cel musi być większy lub równy ${VALIDATION_LIMITS.MIN_GOAL}`,
    };
  }

  if (numValue > VALIDATION_LIMITS.MAX_GOAL) {
    return {
      valid: false,
      error: `Cel musi być mniejszy lub równy ${VALIDATION_LIMITS.MAX_GOAL}`,
    };
  }

  return { valid: true, error: null };
}

export function useCalorieGoalForm(currentGoal: CalorieGoalResponseDTO | null): UseCalorieGoalFormReturn {
  const [state, setState] = useState<EditCalorieGoalViewModel>(() => getInitialState(currentGoal));

  /**
   * Synchronizuje wartość początkową gdy currentGoal się zmieni
   */
  useEffect(() => {
    if (currentGoal?.daily_goal) {
      setState((prev) => ({
        ...prev,
        goalValue: currentGoal.daily_goal.toString(),
      }));
    }
  }, [currentGoal]);

  /**
   * Aktualizuje wartość pola goal
   */
  const updateGoalValue = useCallback((value: string) => {
    setState((prev) => ({
      ...prev,
      goalValue: value,
      validationError: null, // Clear validation error on change
      apiError: null, // Clear API error on change
    }));
  }, []);

  /**
   * Waliduje pole formularza
   * @returns true jeśli walidacja przeszła pomyślnie
   */
  const validateField = useCallback((): boolean => {
    const validation = validateGoalValue(state.goalValue);

    if (!validation.valid) {
      setState((prev) => ({
        ...prev,
        validationError: validation.error,
      }));
      return false;
    }

    setState((prev) => ({
      ...prev,
      validationError: null,
    }));
    return true;
  }, [state.goalValue]);

  /**
   * Wysyła formularz do API
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
   * @throws Error jeśli walidacja nie przeszła lub wystąpił błąd API
   */
  const submitGoal = useCallback(async (): Promise<CalorieGoalResponseDTO> => {
    // Walidacja
    const validation = validateGoalValue(state.goalValue);
    if (!validation.valid) {
      setState((prev) => ({
        ...prev,
        validationError: validation.error,
      }));
      throw new Error("Validation failed");
    }

    // Clear errors and start loading
    setState((prev) => ({
      ...prev,
      isSaving: true,
      validationError: null,
      apiError: null,
    }));

    try {
      // Calculate tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD

      // Step 1: Check if goal for tomorrow already exists
      const checkResponse = await fetch(`/api/v1/calorie-goals/by-date?date=${tomorrowStr}`);

      let method: "POST" | "PATCH";
      let url: string;
      const existingGoalId: string | null = null;

      if (checkResponse.status === 200) {
        // Goal exists - check if it's immutable
        const existingGoal: CalorieGoalResponseDTO & { is_immutable?: boolean } = await checkResponse.json();

        if (existingGoal.is_immutable) {
          // Goal is immutable (already started/used) - create new goal with POST
          // This ensures we don't modify goals that are already in use
          method = "POST";
          url = "/api/v1/calorie-goals";
        } else {
          // Goal is mutable (not started yet) - safe to update with PATCH
          method = "PATCH";
          url = `/api/v1/calorie-goals/${existingGoal.id}`;
        }
      } else if (checkResponse.status === 404) {
        // Goal doesn't exist - use POST to create it
        method = "POST";
        url = "/api/v1/calorie-goals";
      } else {
        // Unexpected error during check
        setState((prev) => ({
          ...prev,
          isSaving: false,
          apiError: "Nie udało się sprawdzić istniejącego celu. Spróbuj ponownie.",
        }));
        throw new Error("Failed to check existing goal");
      }

      // Step 2: Create or update the goal
      const goalData: CreateCalorieGoalRequestDTO = {
        daily_goal: Number(state.goalValue),
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(goalData),
      });

      // Handle 400 Bad Request (validation error from backend)
      if (response.status === 400) {
        const errorData: ErrorResponseDTO = await response.json();

        // Extract validation error details
        const errorMessage = errorData.details
          ? Object.values(errorData.details).join(", ")
          : errorData.message || "Błąd walidacji";

        setState((prev) => ({
          ...prev,
          isSaving: false,
          apiError: errorMessage,
        }));

        throw new Error("Validation error from API");
      }

      // Handle 404 Not Found (for PATCH - goal was deleted between check and update)
      if (response.status === 404 && method === "PATCH") {
        setState((prev) => ({
          ...prev,
          isSaving: false,
          apiError: "Cel został usunięty. Odśwież stronę i spróbuj ponownie.",
        }));

        throw new Error("Goal not found");
      }

      // Handle 409 Conflict (for POST - race condition, goal was created between check and create)
      if (response.status === 409 && method === "POST") {
        setState((prev) => ({
          ...prev,
          isSaving: false,
          apiError: "Cel na jutro został już utworzony. Odśwież stronę i spróbuj ponownie.",
        }));

        throw new Error("Conflict error");
      }

      // Handle 500 Server Error
      if (response.status === 500) {
        setState((prev) => ({
          ...prev,
          isSaving: false,
          apiError: "Wystąpił błąd serwera. Spróbuj ponownie później.",
        }));

        throw new Error("Server error");
      }

      // Handle other errors
      if (!response.ok) {
        setState((prev) => ({
          ...prev,
          isSaving: false,
          apiError: `Nieoczekiwany błąd: ${response.statusText}`,
        }));

        throw new Error(`Unexpected error: ${response.status}`);
      }

      // Success - parse response
      const savedGoal: CalorieGoalResponseDTO = await response.json();

      setState((prev) => ({
        ...prev,
        isSaving: false,
      }));

      return savedGoal;
    } catch (error) {
      // If error was already handled above (has apiError set), re-throw
      if (
        error instanceof Error &&
        (error.message === "Validation error from API" ||
          error.message === "Conflict error" ||
          error.message === "Server error" ||
          error.message === "Goal not found" ||
          error.message === "Failed to check existing goal" ||
          error.message.startsWith("Unexpected error"))
      ) {
        throw error;
      }

      // Network error or other unexpected error
      setState((prev) => ({
        ...prev,
        isSaving: false,
        apiError: "Błąd połączenia. Sprawdź internet i spróbuj ponownie.",
      }));

      throw error;
    }
  }, [state.goalValue]);

  /**
   * Resetuje formularz do stanu początkowego
   */
  const reset = useCallback(() => {
    setState(getInitialState(currentGoal));
  }, [currentGoal]);

  return {
    state,
    updateGoalValue,
    validateField,
    submitGoal,
    reset,
  };
}
