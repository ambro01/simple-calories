/**
 * LoginForm Component
 *
 * Formularz logowania użytkownika z walidacją client-side.
 * Zawiera pola: email, hasło oraz linki do rejestracji i resetowania hasła.
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

interface LoginFormState {
  email: string;
  password: string;
  isLoading: boolean;
  errors: {
    email?: string;
    password?: string;
    general?: string;
  };
}

export function LoginForm() {
  const [state, setState] = useState<LoginFormState>({
    email: "",
    password: "",
    isLoading: false,
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
    return undefined;
  };

  const handleBlur = (field: "email" | "password") => {
    let error: string | undefined;

    if (field === "email") {
      error = validateEmail(state.email);
    } else if (field === "password") {
      error = validatePassword(state.password);
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

    if (emailError || passwordError) {
      setState((prev) => ({
        ...prev,
        errors: {
          email: emailError,
          password: passwordError,
        },
      }));

      // Focus first error field
      if (emailError) {
        document.getElementById("email")?.focus();
      } else if (passwordError) {
        document.getElementById("password")?.focus();
      }

      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, errors: {} }));

    try {
      // TODO: Wywołanie API /api/v1/auth/login
      // const response = await fetch("/api/v1/auth/login", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     email: state.email,
      //     password: state.password,
      //   }),
      // });

      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.message || "Nieprawidłowy email lub hasło");
      // }

      // Redirect na / (dashboard) po sukcesie
      // window.location.href = "/";

      // Tymczasowo - symulacja sukcesu
      console.log("Login attempt:", {
        email: state.email,
        password: "***",
      });

      alert("Logowanie - UI gotowe! Backend będzie zaimplementowany później.");
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
        <CardTitle>Zaloguj się</CardTitle>
        <CardDescription>Witaj ponownie! Wprowadź swoje dane logowania.</CardDescription>
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Hasło</Label>
            <a
              href="/auth/forgot-password"
              className="text-xs text-primary hover:underline"
            >
              Zapomniałem hasła
            </a>
          </div>
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
            placeholder="Wprowadź hasło"
            error={state.errors.password}
            disabled={state.isLoading}
            autoComplete="current-password"
          />
          {state.errors.password && (
            <p id="password-error" className="text-sm text-red-500 mt-1" role="alert">
              {state.errors.password}
            </p>
          )}
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          disabled={state.isLoading}
          className="w-full"
        >
          {state.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {state.isLoading ? "Logowanie..." : "Zaloguj się"}
        </Button>
        </form>

        <AuthFormFooter
          text="Nie masz konta?"
          linkText="Zarejestruj się"
          linkHref="/auth/signup"
        />
      </CardContent>
    </Card>
  );
}
