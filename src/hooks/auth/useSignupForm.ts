/**
 * Custom hook for signup form
 * Uses React Hook Form + Zod validation
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupFormData } from "@/utils/validation/schemas";
import { authService } from "@/services/auth.service";

export function useSignupForm() {
  const [apiError, setApiError] = useState<string | undefined>();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      passwordConfirm: "",
    },
    mode: "onBlur", // Validate on blur for better UX
  });

  const onSubmit = async (data: SignupFormData) => {
    setApiError(undefined);

    const result = await authService.signup({
      email: data.email,
      password: data.password,
    });

    if (!result.success) {
      setApiError(result.error);
      return;
    }

    setIsSuccess(true);
  };

  return {
    form,
    apiError,
    isSuccess,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
  };
}
