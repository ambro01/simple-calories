/**
 * PasswordResetSuccess Component
 * Success state for forgot password form
 */

import { CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

type PasswordResetSuccessProps = {
  email: string;
  onResend: () => void;
  onBackToLogin: () => void;
};

export function PasswordResetSuccess({ email, onResend, onBackToLogin }: PasswordResetSuccessProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
            <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Sprawdź swoją skrzynkę</h2>
          <p className="text-sm text-muted-foreground">Link do resetu hasła został wysłany na adres:</p>
          <p className="text-sm font-medium text-foreground mt-2">{email}</p>
        </div>

        <Alert className="mb-4">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Email wysłany</AlertTitle>
          <AlertDescription>
            Jeśli podany adres email istnieje w systemie, otrzymasz wiadomość z linkiem do resetu hasła. Link jest ważny
            przez 1 godzinę.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Button onClick={onBackToLogin} variant="outline" className="w-full">
            Wróć do logowania
          </Button>

          <button
            onClick={onResend}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Wyślij ponownie
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
