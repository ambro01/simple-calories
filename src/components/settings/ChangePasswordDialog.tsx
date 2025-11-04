/**
 * ChangePasswordDialog Component
 *
 * Dialog do zmiany hasła użytkownika.
 * Pozwala na wprowadzenie aktualnego hasła oraz nowego hasła.
 * Zawiera walidację i obsługę błędów z API.
 */

import { useEffect, useState } from "react";
import { Info, Loader2, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ChangePasswordDialogProps } from "@/types/settings.types";
import { useChangePasswordForm } from "@/hooks/useChangePasswordForm";

export function ChangePasswordDialog({ open, onOpenChange, onSuccess }: ChangePasswordDialogProps) {
  const form = useChangePasswordForm();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  /**
   * Reset formularza przy otwieraniu dialogu
   */
  useEffect(() => {
    if (open) {
      form.reset();
      setShowCurrentPassword(false);
      setShowNewPassword(false);
    }
  }, [open]);

  /**
   * Obsługa submit formularza
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await form.submitPasswordChange();

      // Sukces - wywołaj callback i zamknij dialog
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      // Błędy są obsługiwane w hooku (form.state.validationError lub form.state.apiError)
      console.error("Failed to change password:", error);
    }
  };

  /**
   * Obsługa zamknięcia dialogu
   */
  const handleClose = (isOpen: boolean) => {
    if (!isOpen && !form.state.isSaving) {
      // Zamknięcie tylko jeśli nie trwa zapisywanie
      onOpenChange(false);
    }
  };

  /**
   * Obsługa klawisza Enter w polu input
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !form.state.isSaving) {
      handleSubmit(e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Zmiana hasła</DialogTitle>
          <DialogDescription>
            Wprowadź aktualne hasło oraz nowe hasło, które chcesz ustawić.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {/* Info Alert */}
          <Alert className="mb-4 border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Nowe hasło musi mieć co najmniej 8 znaków.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {/* Current Password Field */}
            <div className="space-y-2">
              <Label htmlFor="current_password">
                Aktualne hasło <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="current_password"
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Wprowadź aktualne hasło"
                  value={form.state.currentPassword}
                  onChange={(e) => form.updateCurrentPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={form.state.isSaving}
                  className={form.state.validationError ? "border-destructive focus-visible:ring-destructive pr-10" : "pr-10"}
                  aria-invalid={!!form.state.validationError}
                  aria-describedby={form.state.validationError ? "password-error" : undefined}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showCurrentPassword ? "Ukryj hasło" : "Pokaż hasło"}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password Field */}
            <div className="space-y-2">
              <Label htmlFor="new_password">
                Nowe hasło <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Wprowadź nowe hasło"
                  value={form.state.newPassword}
                  onChange={(e) => form.updateNewPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={form.state.isSaving}
                  className={form.state.validationError ? "border-destructive focus-visible:ring-destructive pr-10" : "pr-10"}
                  aria-invalid={!!form.state.validationError}
                  aria-describedby={form.state.validationError ? "password-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showNewPassword ? "Ukryj hasło" : "Pokaż hasło"}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Validation Error */}
            {form.state.validationError && (
              <p id="password-error" className="text-sm text-destructive" role="alert">
                {form.state.validationError}
              </p>
            )}
          </div>

          {/* API Error */}
          {form.state.apiError && (
            <Alert className="mt-4 border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
              <AlertDescription>{form.state.apiError}</AlertDescription>
            </Alert>
          )}

          {/* Dialog Footer with Actions */}
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={form.state.isSaving}>
              Anuluj
            </Button>
            <Button type="submit" disabled={form.state.isSaving}>
              {form.state.isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {form.state.isSaving ? "Zmieniam hasło..." : "Zmień hasło"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
