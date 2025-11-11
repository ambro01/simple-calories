/**
 * Custom hook for forgot password form
 * Uses React Hook Form + Zod validation
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/utils/validation/schemas";
import { authService } from "@/services/auth.service";

export function useForgotPasswordForm() {
  const [apiError, setApiError] = useState<string | undefined>();
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string>("");

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setApiError(undefined);

    const result = await authService.forgotPassword(data);

    if (!result.success) {
      setApiError(result.error);
      return;
    }

    setSubmittedEmail(data.email);
    setIsSuccess(true);
  };

  const resetForm = () => {
    setIsSuccess(false);
    setSubmittedEmail("");
    setApiError(undefined);
    form.reset();
  };

  return {
    form,
    apiError,
    isSuccess,
    submittedEmail,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
    resetForm,
  };
}
