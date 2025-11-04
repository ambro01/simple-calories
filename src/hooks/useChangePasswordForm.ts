/**
 * useChangePasswordForm Hook
 *
 * Hook zarządzający stanem formularza zmiany hasła.
 * Obsługuje walidację, submit do API, i obsługę błędów.
 */

import { useState, useCallback } from "react";
import type { ChangePasswordViewModel } from "@/types/settings.types";
import type { ErrorResponseDTO } from "@/types";

// Stałe walidacji (zgodne z backendem - changePasswordSchema)
const VALIDATION_LIMITS = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 100,
};

interface UseChangePasswordFormReturn {
  state: ChangePasswordViewModel;
  updateCurrentPassword: (value: string) => void;
  updateNewPassword: (value: string) => void;
  validateFields: () => boolean;
  submitPasswordChange: () => Promise<void>;
  reset: () => void;
}

/**
 * Tworzy początkowy stan formularza
 */
function getInitialState(): ChangePasswordViewModel {
  return {
    currentPassword: "",
    newPassword: "",
    isSaving: false,
    validationError: null,
    apiError: null,
  };
}

/**
 * Walidacja pól formularza
 * @returns obiekt z informacją czy walidacja przeszła i komunikatem błędu
 */
function validatePasswords(
  currentPassword: string,
  newPassword: string
): {
  valid: boolean;
  error: string | null;
} {
  // Check if current password is empty
  if (!currentPassword.trim()) {
    return {
      valid: false,
      error: "Aktualne hasło jest wymagane",
    };
  }

  // Check if new password is empty
  if (!newPassword.trim()) {
    return {
      valid: false,
      error: "Nowe hasło jest wymagane",
    };
  }

  // Check new password length (minimum)
  if (newPassword.length < VALIDATION_LIMITS.MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      error: `Nowe hasło musi mieć co najmniej ${VALIDATION_LIMITS.MIN_PASSWORD_LENGTH} znaków`,
    };
  }

  // Check new password length (maximum)
  if (newPassword.length > VALIDATION_LIMITS.MAX_PASSWORD_LENGTH) {
    return {
      valid: false,
      error: `Nowe hasło nie może przekraczać ${VALIDATION_LIMITS.MAX_PASSWORD_LENGTH} znaków`,
    };
  }

  // Check if passwords are the same
  if (currentPassword === newPassword) {
    return {
      valid: false,
      error: "Nowe hasło musi być różne od obecnego",
    };
  }

  return { valid: true, error: null };
}

export function useChangePasswordForm(): UseChangePasswordFormReturn {
  const [state, setState] = useState<ChangePasswordViewModel>(getInitialState);

  /**
   * Aktualizuje wartość pola current password
   */
  const updateCurrentPassword = useCallback((value: string) => {
    setState((prev) => ({
      ...prev,
      currentPassword: value,
      validationError: null, // Clear validation error on change
      apiError: null, // Clear API error on change
    }));
  }, []);

  /**
   * Aktualizuje wartość pola new password
   */
  const updateNewPassword = useCallback((value: string) => {
    setState((prev) => ({
      ...prev,
      newPassword: value,
      validationError: null, // Clear validation error on change
      apiError: null, // Clear API error on change
    }));
  }, []);

  /**
   * Waliduje pola formularza
   * @returns true jeśli walidacja przeszła pomyślnie
   */
  const validateFields = useCallback((): boolean => {
    const validation = validatePasswords(state.currentPassword, state.newPassword);

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
  }, [state.currentPassword, state.newPassword]);

  /**
   * Wysyła formularz do API
   *
   * @throws Error jeśli walidacja nie przeszła lub wystąpił błąd API
   */
  const submitPasswordChange = useCallback(async (): Promise<void> => {
    // Walidacja
    const validation = validatePasswords(state.currentPassword, state.newPassword);
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
      const response = await fetch("/api/v1/profile/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: state.currentPassword,
          newPassword: state.newPassword,
        }),
      });

      // Handle 400 Bad Request (validation error or wrong password)
      if (response.status === 400) {
        const errorData: ErrorResponseDTO = await response.json();

        // Extract error message
        const errorMessage = errorData.details
          ? Object.values(errorData.details).join(", ")
          : errorData.message || "Błąd podczas zmiany hasła";

        setState((prev) => ({
          ...prev,
          isSaving: false,
          apiError: errorMessage,
        }));

        throw new Error("Bad request from API");
      }

      // Handle 401 Unauthorized
      if (response.status === 401) {
        setState((prev) => ({
          ...prev,
          isSaving: false,
          apiError: "Sesja wygasła. Zaloguj się ponownie.",
        }));

        throw new Error("Unauthorized");
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

      // Success
      setState((prev) => ({
        ...prev,
        isSaving: false,
      }));
    } catch (error) {
      // If error was already handled above (has apiError set), re-throw
      if (
        error instanceof Error &&
        (error.message === "Bad request from API" ||
          error.message === "Unauthorized" ||
          error.message === "Server error" ||
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
  }, [state.currentPassword, state.newPassword]);

  /**
   * Resetuje formularz do stanu początkowego
   */
  const reset = useCallback(() => {
    setState(getInitialState());
  }, []);

  return {
    state,
    updateCurrentPassword,
    updateNewPassword,
    validateFields,
    submitPasswordChange,
    reset,
  };
}
