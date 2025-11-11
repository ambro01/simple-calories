/**
 * Password Service
 * Centralized API calls for password operations
 */

import type { ChangePasswordFormData } from "@/utils/validation/schemas";
import type { ErrorResponseDTO } from "@/types";

export type PasswordChangeResponse = {
  success: boolean;
  error?: string;
};

/**
 * Password API client
 */
export const passwordService = {
  /**
   * Change password for logged-in user
   * @throws Error with user-friendly message
   */
  async changePassword(data: ChangePasswordFormData): Promise<void> {
    try {
      const response = await fetch("/api/v1/profile/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      // Handle 400 Bad Request (validation error or wrong password)
      if (response.status === 400) {
        const errorData: ErrorResponseDTO = await response.json();

        // Extract error message
        const errorMessage = errorData.details
          ? Object.values(errorData.details).join(", ")
          : errorData.message || "Błąd podczas zmiany hasła";

        throw new Error(errorMessage);
      }

      // Handle 401 Unauthorized
      if (response.status === 401) {
        throw new Error("Sesja wygasła. Zaloguj się ponownie.");
      }

      // Handle 500 Server Error
      if (response.status === 500) {
        throw new Error("Wystąpił błąd serwera. Spróbuj ponownie później.");
      }

      // Handle other errors
      if (!response.ok) {
        throw new Error(`Nieoczekiwany błąd: ${response.statusText}`);
      }

      // Success - no need to return anything
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
