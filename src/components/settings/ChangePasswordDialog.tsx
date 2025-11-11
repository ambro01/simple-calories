/**
 * ChangePasswordDialog Component (Refactored with React Hook Form)
 *
 * Dialog do zmiany hasła użytkownika.
 * Wykorzystuje React Hook Form + Zod dla walidacji i zarządzania stanem.
 */

import { useEffect } from "react";
import { Info, Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ChangePasswordDialogProps } from "@/types/settings.types";
import { useChangePasswordForm } from "@/hooks/useChangePasswordForm";
import { PasswordField } from "@/components/auth/PasswordField";

export function ChangePasswordDialog({ open, onOpenChange, onSuccess }: ChangePasswordDialogProps) {
  const { form, apiError, onSubmit, isSubmitting, reset } = useChangePasswordForm();

  /**
   * Reset formularza przy otwieraniu dialogu
   */
  useEffect(() => {
    if (open) {
      reset();
    }
  }, [open, reset]);

  /**
   * Obsługa submit formularza
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Sprawdź czy formularz jest poprawny przed próbą zapisu
    const isValid = await form.trigger();
    if (!isValid) {
      return; // Nie zamykaj dialogu jeśli walidacja nie przeszła
    }

    try {
      await onSubmit(e);

      // Sukces - wywołaj callback i zamknij dialog
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      // Błędy są już obsłużone w hooku (apiError)
      // eslint-disable-next-line no-console -- Error logging for debugging
      console.error("Failed to change password:", error);
    }
  };

  /**
   * Obsługa zamknięcia dialogu
   */
  const handleClose = (isOpen: boolean) => {
    if (!isOpen && !isSubmitting) {
      // Zamknięcie tylko jeśli nie trwa zapisywanie
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Zmiana hasła</DialogTitle>
          <DialogDescription>Wprowadź aktualne hasło oraz nowe hasło, które chcesz ustawić.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {/* Info Alert */}
          <Alert className="mb-4 border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">Nowe hasło musi mieć co najmniej 8 znaków.</AlertDescription>
          </Alert>

          <div className="space-y-4">
            {/* Current Password Field */}
            <div className="space-y-2">
              <Label htmlFor="current_password">
                Aktualne hasło <span className="text-destructive">*</span>
              </Label>
              <PasswordField
                id="current_password"
                placeholder="Wprowadź aktualne hasło"
                {...form.register("currentPassword")}
                error={form.formState.errors.currentPassword}
                disabled={isSubmitting}
                autoComplete="current-password"
              />
              {form.formState.errors.currentPassword && (
                <p className="text-sm text-destructive" role="alert">
                  {form.formState.errors.currentPassword.message}
                </p>
              )}
            </div>

            {/* New Password Field */}
            <div className="space-y-2">
              <Label htmlFor="new_password">
                Nowe hasło <span className="text-destructive">*</span>
              </Label>
              <PasswordField
                id="new_password"
                placeholder="Wprowadź nowe hasło"
                {...form.register("newPassword")}
                error={form.formState.errors.newPassword}
                disabled={isSubmitting}
                autoComplete="new-password"
              />
              {form.formState.errors.newPassword && (
                <p className="text-sm text-destructive" role="alert">
                  {form.formState.errors.newPassword.message}
                </p>
              )}
            </div>
          </div>

          {/* API Error */}
          {apiError && (
            <Alert className="mt-4 border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Błąd</AlertTitle>
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}

          {/* Dialog Footer with Actions */}
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Zmieniam hasło..." : "Zmień hasło"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
