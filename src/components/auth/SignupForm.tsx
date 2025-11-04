/**
 * SignupForm Component
 *
 * Formularz rejestracji użytkownika z walidacją client-side.
 * Zawiera pola: email, hasło, potwierdzenie hasła.
 */

import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "./PasswordInput";
import { AuthFormFooter } from "./AuthFormFooter";

interface SignupFormState {
  email: string;
  password: string;
  passwordConfirm: string;
  isLoading: boolean;
  isSuccess: boolean;
  errors: {
    email?: string;
    password?: string;
    passwordConfirm?: string;
    general?: string;
  };
}

export function SignupForm() {
  const [state, setState] = useState<SignupFormState>({
    email: "",
    password: "",
    passwordConfirm: "",
    isLoading: false,
    isSuccess: false,
    errors: {},
  });

  const validateEmail = (email: string): string | undefined => {
    if (!email) {
      return "Email jest wymagany";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Nieprawidłowy format email";
    }
    return undefined;
  };

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

  const handleBlur = (field: "email" | "password" | "passwordConfirm") => {
    let error: string | undefined;

    if (field === "email") {
      error = validateEmail(state.email);
    } else if (field === "password") {
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
    const emailError = validateEmail(state.email);
    const passwordError = validatePassword(state.password);
    const passwordConfirmError = validatePasswordConfirm(state.passwordConfirm);

    if (emailError || passwordError || passwordConfirmError) {
      setState((prev) => ({
        ...prev,
        errors: {
          email: emailError,
          password: passwordError,
          passwordConfirm: passwordConfirmError,
        },
      }));

      // Focus first error field
      if (emailError) {
        document.getElementById("email")?.focus();
      } else if (passwordError) {
        document.getElementById("password")?.focus();
      } else if (passwordConfirmError) {
        document.getElementById("passwordConfirm")?.focus();
      }

      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, errors: {} }));

    try {
      // Call signup API endpoint
      const response = await fetch("/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: state.email,
          password: state.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Nie udało się utworzyć konta");
      }

      // Show success message instead of redirecting
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isSuccess: true,
      }));
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

  // Show success message if registration completed
  if (state.isSuccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Konto utworzone!</CardTitle>
          <CardDescription>Sprawdź swoją skrzynkę email</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Email weryfikacyjny wysłany</AlertTitle>
            <AlertDescription>
              Wysłaliśmy wiadomość weryfikacyjną na adres <strong>{state.email}</strong>
            </AlertDescription>
          </Alert>

          <Button asChild className="w-full">
            <a href="/auth/login">Przejdź do logowania</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Utwórz konto</CardTitle>
        <CardDescription>Zacznij śledzić swoje kalorie już dziś</CardDescription>
      </CardHeader>
      <CardContent>
        {state.errors.general && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Błąd</AlertTitle>
            <AlertDescription>{state.errors.general}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={state.email}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  email: e.target.value,
                  errors: { ...prev.errors, email: undefined },
                }))
              }
              onBlur={() => handleBlur("email")}
              placeholder="jan@example.com"
              disabled={state.isLoading}
              className={state.errors.email ? "border-red-500" : ""}
              aria-invalid={!!state.errors.email}
              aria-describedby={state.errors.email ? "email-error" : undefined}
              autoComplete="email"
            />
            {state.errors.email && (
              <p id="email-error" className="text-sm text-red-500 mt-1" role="alert">
                {state.errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Hasło</Label>
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
            <Label htmlFor="passwordConfirm">Powtórz hasło</Label>
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
            {state.isLoading ? "Tworzenie konta..." : "Zarejestruj się"}
          </Button>
        </form>

        <AuthFormFooter text="Masz już konto?" linkText="Zaloguj się" linkHref="/auth/login" />
      </CardContent>
    </Card>
  );
}
