/**
 * Custom hook for login form
 * Uses React Hook Form + Zod validation
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/utils/validation/schemas";
import { authService } from "@/services/auth.service";

export function useLoginForm() {
  const [apiError, setApiError] = useState<string | undefined>();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: LoginFormData) => {
    setApiError(undefined);

    const result = await authService.login(data);

    if (!result.success) {
      setApiError(result.error);
      return;
    }

    // Redirect to dashboard on success
    setTimeout(() => {
      window.location.href = "/";
    }, 0);
  };

  return {
    form,
    apiError,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
  };
}
