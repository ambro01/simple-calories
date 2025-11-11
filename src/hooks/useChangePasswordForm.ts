/**
 * useChangePasswordForm Hook (Refactored with React Hook Form)
 *
 * Hook zarządzający stanem formularza zmiany hasła.
 * Używa React Hook Form + Zod dla walidacji i zarządzania stanem.
 */

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, type ChangePasswordFormData } from "@/utils/validation/schemas";
import { passwordService } from "@/services/password.service";

type UseChangePasswordFormReturn = {
  form: ReturnType<typeof useForm<ChangePasswordFormData>>;
  apiError: string | null;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
  reset: () => void;
};

export function useChangePasswordForm(): UseChangePasswordFormReturn {
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
    mode: "onBlur", // Validate on blur for better UX
  });

  /**
   * Wysyła formularz do API
   */
  const handleSubmit = async (data: ChangePasswordFormData) => {
    setApiError(null);

    try {
      await passwordService.changePassword(data);
      // Success - caller will handle success callback
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Nie udało się zmienić hasła";
      setApiError(errorMessage);
      throw error; // Re-throw so caller knows it failed
    }
  };

  /**
   * Resetuje formularz do stanu początkowego
   */
  const reset = useCallback(() => {
    form.reset();
    setApiError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- form.reset is stable
  }, []);

  return {
    form,
    apiError,
    onSubmit: form.handleSubmit(handleSubmit),
    isSubmitting: form.formState.isSubmitting,
    reset,
  };
}
