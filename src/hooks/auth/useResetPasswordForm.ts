/**
 * Custom hook for reset password form
 * Uses React Hook Form + Zod validation
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/utils/validation/schemas";
import { authService } from "@/services/auth.service";

export function useResetPasswordForm() {
  const [apiError, setApiError] = useState<string | undefined>();

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      passwordConfirm: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setApiError(undefined);

    const result = await authService.resetPassword({
      password: data.password,
    });

    if (!result.success) {
      setApiError(result.error);
      return;
    }

    // Redirect to login with success message
    setTimeout(() => {
      window.location.href = "/auth/login?success=password_reset";
    }, 0);
  };

  return {
    form,
    apiError,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
  };
}
