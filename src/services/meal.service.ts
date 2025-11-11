/**
 * Meal Service
 * Centralized API calls for meal operations
 */

import type {
  MealResponseDTO,
  CreateMealRequestDTO,
  UpdateMealRequestDTO,
  CreateMealResponseDTO,
  ErrorResponseDTO,
} from "@/types";

/**
 * Custom error class for API errors with validation details
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public details?: Record<string, string>
  ) {
    super("API Error");
    this.name = "ApiError";
  }
}

/**
 * Helper function to handle API errors
 */
function handleApiError(response: Response, errorData: ErrorResponseDTO): ApiError {
  const details = errorData.details || {};
  return new ApiError(response.status, details);
}

/**
 * Meal API client
 */
export const mealService = {
  /**
   * Get meal by ID
   * @throws ApiError if meal not found or API error
   */
  async getMealById(id: string): Promise<MealResponseDTO> {
    const response = await fetch(`/api/v1/meals/${id}`);

    if (response.status === 404) {
      throw new Error("Posiłek nie został znaleziony");
    }

    if (!response.ok) {
      throw new Error("Nie udało się wczytać posiłku. Spróbuj ponownie.");
    }

    return response.json();
  },

  /**
   * Create new meal
   * @throws ApiError with validation details or Error with user-friendly message
   */
  async createMeal(data: CreateMealRequestDTO): Promise<CreateMealResponseDTO> {
    const response = await fetch("/api/v1/meals", {
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

    if (response.status === 404) {
      throw new Error("Nie znaleziono generacji AI. Spróbuj wygenerować ponownie.");
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
   * Update existing meal
   * @throws ApiError with validation details or Error with user-friendly message
   */
  async updateMeal(id: string, data: UpdateMealRequestDTO): Promise<MealResponseDTO> {
    const response = await fetch(`/api/v1/meals/${id}`, {
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
      throw new Error("Posiłek nie został znaleziony. Możliwe że został usunięty.");
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
   * Delete meal
   * @throws Error with user-friendly message
   */
  async deleteMeal(id: string): Promise<void> {
    const response = await fetch(`/api/v1/meals/${id}`, {
      method: "DELETE",
    });

    if (response.status === 404) {
      throw new Error("Posiłek nie został znaleziony");
    }

    if (response.status === 500) {
      throw new Error("Wystąpił błąd serwera. Spróbuj ponownie później.");
    }

    if (!response.ok) {
      throw new Error(`Nieoczekiwany błąd: ${response.statusText}`);
    }
  },
};
