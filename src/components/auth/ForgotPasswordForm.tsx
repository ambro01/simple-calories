/**
 * ForgotPasswordForm Component
 *
 * Formularz żądania resetu hasła.
 * Po wysłaniu emaila wyświetla komunikat sukcesu.
 */

import { useState } from "react";
import { Loader2, AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ForgotPasswordFormState = {
  email: string;
  isLoading: boolean;
  isSuccess: boolean;
  errors: {
    email?: string;
    general?: string;
  };
};

export function ForgotPasswordForm() {
  const [state, setState] = useState<ForgotPasswordFormState>({
    email: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(state.email);

    if (emailError) {
      setState((prev) => ({
        ...prev,
        errors: { email: emailError },
      }));
      document.getElementById("email")?.focus();
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, errors: {} }));

    try {
      // TODO: Wywołanie API /api/v1/auth/forgot-password
      // const response = await fetch("/api/v1/auth/forgot-password", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email: state.email }),
      // });

      // if (!response.ok) {
      //   throw new Error("Nie udało się wysłać emaila");
      // }

      // UWAGA: Zawsze pokazujemy sukces (bezpieczeństwo - nie ujawniamy czy email istnieje)
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isSuccess: true,
      }));

      // Tymczasowo - symulacja sukcesu
      console.log("Forgot password request for:", state.email);
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

  // Success state
  if (state.isSuccess) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
              <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Sprawdź swoją skrzynkę</h2>
            <p className="text-sm text-muted-foreground">Link do resetu hasła został wysłany na adres:</p>
            <p className="text-sm font-medium text-foreground mt-2">{state.email}</p>
          </div>

          <Alert className="mb-4">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Email wysłany</AlertTitle>
            <AlertDescription>
              Jeśli podany adres email istnieje w systemie, otrzymasz wiadomość z linkiem do resetu hasła. Link jest
              ważny przez 1 godzinę.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button onClick={() => (window.location.href = "/auth/login")} variant="outline" className="w-full">
              Wróć do logowania
            </Button>

            <button
              onClick={() =>
                setState({
                  email: "",
                  isLoading: false,
                  isSuccess: false,
                  errors: {},
                })
              }
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Wyślij ponownie
            </button>
          </div>
        </CardContent>
      </Card>
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
              placeholder="jan@example.com"
              disabled={state.isLoading}
              className={state.errors.email ? "border-red-500" : ""}
              aria-invalid={!!state.errors.email}
              aria-describedby={state.errors.email ? "email-error" : undefined}
              autoComplete="email"
              autoFocus
            />
            {state.errors.email && (
              <p id="email-error" className="text-sm text-red-500 mt-1" role="alert">
                {state.errors.email}
              </p>
            )}
          </div>

          {/* Submit button */}
          <Button type="submit" disabled={state.isLoading} className="w-full">
            {state.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {state.isLoading ? "Wysyłanie..." : "Wyślij link resetujący"}
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
