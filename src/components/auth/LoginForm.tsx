/**
 * LoginForm Component (Refactored)
 *
 * Formularz logowania użytkownika z walidacją client-side.
 * Wykorzystuje React Hook Form + Zod dla walidacji i zarządzania stanem.
 */

import { Loader2, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthFormFooter } from "./AuthFormFooter";
import { FormField } from "./FormField";
import { EmailField } from "./EmailField";
import { PasswordField } from "./PasswordField";
import { useLoginForm } from "@/hooks/auth/useLoginForm";

export function LoginForm() {
  const { form, apiError, onSubmit, isSubmitting } = useLoginForm();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zaloguj się</CardTitle>
        <CardDescription>Witaj ponownie! Wprowadź swoje dane logowania.</CardDescription>
      </CardHeader>
      <CardContent>
        {apiError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Błąd</AlertTitle>
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={onSubmit} className="space-y-4" data-testid="login-form">
          {/* Email */}
          <FormField label="Email" htmlFor="email" error={form.formState.errors.email}>
            <EmailField
              {...form.register("email")}
              error={form.formState.errors.email}
              disabled={isSubmitting}
              data-testid="login-email-input"
            />
          </FormField>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Hasło</Label>
              <a href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                Zapomniałem hasła
              </a>
            </div>
            <PasswordField
              {...form.register("password")}
              placeholder="Wprowadź hasło"
              error={form.formState.errors.password}
              disabled={isSubmitting}
              data-testid="login-password-input"
            />
            {form.formState.errors.password && (
              <p id="password-error" className="text-sm text-red-500 mt-1" role="alert">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {/* Submit button */}
          <Button type="submit" disabled={isSubmitting} className="w-full" data-testid="login-submit-button">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Logowanie..." : "Zaloguj się"}
          </Button>
        </form>

        <AuthFormFooter text="Nie masz konta?" linkText="Zarejestruj się" linkHref="/auth/signup" />
      </CardContent>
    </Card>
  );
}
