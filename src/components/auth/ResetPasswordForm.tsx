/**
 * ResetPasswordForm Component
 *
 * Formularz ustawiania nowego hasła po kliknięciu w link z emaila.
 * Wymaga ważnego tokenu recovery w sesji.
 */

import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "./PasswordInput";

interface ResetPasswordFormState {
  password: string;
  passwordConfirm: string;
  isLoading: boolean;
  errors: {
    password?: string;
    passwordConfirm?: string;
    general?: string;
  };
}

export function ResetPasswordForm() {
  const [state, setState] = useState<ResetPasswordFormState>({
    password: "",
    passwordConfirm: "",
    isLoading: false,
    errors: {},
  });

  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return "Hasło jest wymagane";
    }
    if (password.length < 8) {
      return "Hasło musi mieć minimum 8 znaków";
    }
    if (password.length > 72) {
      return "Hasło może mieć maksymalnie 72 znaki";
    }
    return undefined;
  };

  const validatePasswordConfirm = (passwordConfirm: string): string | undefined => {
    if (!passwordConfirm) {
      return "Potwierdzenie hasła jest wymagane";
    }
    if (passwordConfirm !== state.password) {
      return "Hasła muszą być identyczne";
    }
    return undefined;
  };

  const handleBlur = (field: "password" | "passwordConfirm") => {
    let error: string | undefined;

    if (field === "password") {
      error = validatePassword(state.password);
    } else if (field === "passwordConfirm") {
      error = validatePasswordConfirm(state.passwordConfirm);
    }

    setState((prev) => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: error,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const passwordError = validatePassword(state.password);
    const passwordConfirmError = validatePasswordConfirm(state.passwordConfirm);

    if (passwordError || passwordConfirmError) {
      setState((prev) => ({
        ...prev,
        errors: {
          password: passwordError,
          passwordConfirm: passwordConfirmError,
        },
      }));

      // Focus first error field
      if (passwordError) {
        document.getElementById("password")?.focus();
      } else if (passwordConfirmError) {
        document.getElementById("passwordConfirm")?.focus();
      }

      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, errors: {} }));

    try {
      // TODO: Wywołanie API /api/v1/auth/reset-password
      // Token jest już w sesji (Supabase callback go ustawił)
      // const response = await fetch("/api/v1/auth/reset-password", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ password: state.password }),
      // });

      // if (!response.ok) {
      //   const errorData = await response.json();
      //   if (errorData.message?.includes("token") || errorData.message?.includes("wygasł")) {
      //     throw new Error("Link wygasł lub jest nieprawidłowy");
      //   }
      //   throw new Error(errorData.message || "Nie udało się zmienić hasła");
      // }

      // Redirect na /auth/login?success=password_reset po sukcesie
      // window.location.href = "/auth/login?success=password_reset";

      // Tymczasowo - symulacja sukcesu
      console.log("Reset password attempt");
      alert("Reset hasła - UI gotowe! Backend będzie zaimplementowany później.");
      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        errors: {
          general: error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd",
        },
      }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ustaw nowe hasło</CardTitle>
        <CardDescription>Wprowadź nowe hasło dla swojego konta.</CardDescription>
      </CardHeader>
      <CardContent>
        {state.errors.general && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Błąd</AlertTitle>
            <AlertDescription>
              {state.errors.general}
              {state.errors.general.includes("wygasł") && (
                <div className="mt-2">
                  <a
                    href="/auth/forgot-password"
                    className="text-sm underline hover:no-underline"
                  >
                    Poproś o nowy link do resetu hasła
                  </a>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
        {/* New Password */}
        <div className="space-y-2">
          <Label htmlFor="password">Nowe hasło</Label>
          <PasswordInput
            id="password"
            value={state.password}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                password: e.target.value,
                errors: { ...prev.errors, password: undefined },
              }))
            }
            onBlur={() => handleBlur("password")}
            placeholder="Minimum 8 znaków"
            error={state.errors.password}
            disabled={state.isLoading}
            autoComplete="new-password"
          />
          {state.errors.password && (
            <p id="password-error" className="text-sm text-red-500 mt-1" role="alert">
              {state.errors.password}
            </p>
          )}
        </div>

        {/* Password Confirm */}
        <div className="space-y-2">
          <Label htmlFor="passwordConfirm">Powtórz nowe hasło</Label>
          <PasswordInput
            id="passwordConfirm"
            value={state.passwordConfirm}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                passwordConfirm: e.target.value,
                errors: { ...prev.errors, passwordConfirm: undefined },
              }))
            }
            onBlur={() => handleBlur("passwordConfirm")}
            placeholder="Powtórz hasło"
            error={state.errors.passwordConfirm}
            disabled={state.isLoading}
            autoComplete="new-password"
          />
          {state.errors.passwordConfirm && (
            <p id="passwordConfirm-error" className="text-sm text-red-500 mt-1" role="alert">
              {state.errors.passwordConfirm}
            </p>
          )}
        </div>

        {/* Submit button */}
          <Button type="submit" disabled={state.isLoading} className="w-full">
            {state.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {state.isLoading ? "Zapisywanie..." : "Zmień hasło"}
          </Button>

          <div className="text-center">
            <a
              href="/auth/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Wróć do logowania
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
