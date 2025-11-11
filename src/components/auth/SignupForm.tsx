/**
 * SignupForm Component (Refactored)
 *
 * Formularz rejestracji użytkownika z walidacją client-side.
 * Wykorzystuje React Hook Form + Zod dla walidacji i zarządzania stanem.
 */

import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthFormFooter } from "./AuthFormFooter";
import { FormField } from "./FormField";
import { EmailField } from "./EmailField";
import { PasswordField } from "./PasswordField";
import { SuccessMessage } from "./SuccessMessage";
import { useSignupForm } from "@/hooks/auth/useSignupForm";

export function SignupForm() {
  const { form, apiError, isSuccess, onSubmit, isSubmitting } = useSignupForm();

  // Show success message if registration completed
  if (isSuccess) {
    return (
      <SuccessMessage
        title="Konto utworzone!"
        description="Sprawdź swoją skrzynkę email"
        alertTitle="Email weryfikacyjny wysłany"
        alertDescription="Wysłaliśmy wiadomość weryfikacyjną na adres"
        email={form.getValues("email")}
        actionText="Przejdź do logowania"
        actionHref="/auth/login"
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Utwórz konto</CardTitle>
        <CardDescription>Zacznij śledzić swoje kalorie już dziś</CardDescription>
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

          {/* Password */}
          <FormField label="Hasło" htmlFor="password" error={form.formState.errors.password}>
            <PasswordField
              {...form.register("password")}
              placeholder="Minimum 8 znaków"
              autoComplete="new-password"
              error={form.formState.errors.password}
              disabled={isSubmitting}
            />
          </FormField>

          {/* Password Confirm */}
          <FormField label="Powtórz hasło" htmlFor="passwordConfirm" error={form.formState.errors.passwordConfirm}>
            <PasswordField
              id="passwordConfirm"
              {...form.register("passwordConfirm")}
              placeholder="Powtórz hasło"
              autoComplete="new-password"
              error={form.formState.errors.passwordConfirm}
              disabled={isSubmitting}
            />
          </FormField>

          {/* Submit button */}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Tworzenie konta..." : "Zarejestruj się"}
          </Button>
        </form>

        <AuthFormFooter text="Masz już konto?" linkText="Zaloguj się" linkHref="/auth/login" />
      </CardContent>
    </Card>
  );
}
