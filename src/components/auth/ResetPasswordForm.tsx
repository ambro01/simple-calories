/**
 * ResetPasswordForm Component (Refactored)
 *
 * Formularz ustawiania nowego hasła po kliknięciu w link z emaila.
 * Wykorzystuje React Hook Form + Zod dla walidacji i zarządzania stanem.
 */

import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "./FormField";
import { PasswordField } from "./PasswordField";
import { useResetPasswordForm } from "@/hooks/auth/useResetPasswordForm";

export function ResetPasswordForm() {
  const { form, apiError, onSubmit, isSubmitting } = useResetPasswordForm();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ustaw nowe hasło</CardTitle>
        <CardDescription>Wprowadź nowe hasło dla swojego konta.</CardDescription>
      </CardHeader>
      <CardContent>
        {apiError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Błąd</AlertTitle>
            <AlertDescription>
              {apiError}
              {apiError.includes("wygasł") && (
                <div className="mt-2">
                  <a href="/auth/forgot-password" className="text-sm underline hover:no-underline">
                    Poproś o nowy link do resetu hasła
                  </a>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          {/* New Password */}
          <FormField label="Nowe hasło" htmlFor="password" error={form.formState.errors.password}>
            <PasswordField
              {...form.register("password")}
              placeholder="Minimum 8 znaków"
              autoComplete="new-password"
              error={form.formState.errors.password}
              disabled={isSubmitting}
            />
          </FormField>

          {/* Password Confirm */}
          <FormField label="Powtórz nowe hasło" htmlFor="passwordConfirm" error={form.formState.errors.passwordConfirm}>
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
            {isSubmitting ? "Zapisywanie..." : "Zmień hasło"}
          </Button>

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
