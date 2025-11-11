/**
 * ForgotPasswordForm Component (Refactored)
 *
 * Formularz żądania resetu hasła.
 * Wykorzystuje React Hook Form + Zod dla walidacji i zarządzania stanem.
 */

import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "./FormField";
import { EmailField } from "./EmailField";
import { PasswordResetSuccess } from "./PasswordResetSuccess";
import { useForgotPasswordForm } from "@/hooks/auth/useForgotPasswordForm";

export function ForgotPasswordForm() {
  const { form, apiError, isSuccess, submittedEmail, onSubmit, isSubmitting, resetForm } = useForgotPasswordForm();

  // Success state
  if (isSuccess) {
    return (
      <PasswordResetSuccess
        email={submittedEmail}
        onResend={resetForm}
        onBackToLogin={() => (window.location.href = "/auth/login")}
      />
    );
  }

  // Form state
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resetowanie hasła</CardTitle>
        <CardDescription>Wprowadź swój adres email, a wyślemy Ci link do resetowania hasła.</CardDescription>
      </CardHeader>
      <CardContent>
        {apiError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Błąd</AlertTitle>
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Email */}
          <FormField label="Email" htmlFor="email" error={form.formState.errors.email}>
            <EmailField {...form.register("email")} error={form.formState.errors.email} disabled={isSubmitting} />
          </FormField>

          {/* Submit button */}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Wysyłanie..." : "Wyślij link resetujący"}
          </Button>

          {/* Back to login link */}
          <div className="text-center">
            <a href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Wróć do logowania
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
