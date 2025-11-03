/**
 * ChangePasswordDialog Component
 *
 * Dialog zmiany hasła w panelu ustawień.
 * Wymaga podania aktualnego hasła oraz nowego hasła z potwierdzeniem.
 */

import { useState } from "react";
import { Loader2, AlertCircle, Key } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PasswordInput } from "@/components/auth/PasswordInput";

interface ChangePasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChangePasswordFormState {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
  isLoading: boolean;
  errors: {
    currentPassword?: string;
    newPassword?: string;
    newPasswordConfirm?: string;
    general?: string;
  };
}

export function ChangePasswordDialog({ isOpen, onClose }: ChangePasswordDialogProps) {
  const [state, setState] = useState<ChangePasswordFormState>({
    currentPassword: "",
    newPassword: "",
    newPasswordConfirm: "",
    isLoading: false,
    errors: {},
  });

  const resetForm = () => {
    setState({
      currentPassword: "",
      newPassword: "",
      newPasswordConfirm: "",
      isLoading: false,
      errors: {},
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateCurrentPassword = (password: string): string | undefined => {
    if (!password) {
      return "Aktualne hasło jest wymagane";
    }
    return undefined;
  };

  const validateNewPassword = (password: string): string | undefined => {
    if (!password) {
      return "Nowe hasło jest wymagane";
    }
    if (password.length < 8) {
      return "Nowe hasło musi mieć minimum 8 znaków";
    }
    if (password.length > 72) {
      return "Nowe hasło może mieć maksymalnie 72 znaki";
    }
    if (password === state.currentPassword) {
      return "Nowe hasło musi być inne niż aktualne";
    }
    return undefined;
  };

  const validateNewPasswordConfirm = (passwordConfirm: string): string | undefined => {
    if (!passwordConfirm) {
      return "Potwierdzenie hasła jest wymagane";
    }
    if (passwordConfirm !== state.newPassword) {
      return "Hasła muszą być identyczne";
    }
    return undefined;
  };

  const handleBlur = (field: "currentPassword" | "newPassword" | "newPasswordConfirm") => {
    let error: string | undefined;

    if (field === "currentPassword") {
      error = validateCurrentPassword(state.currentPassword);
    } else if (field === "newPassword") {
      error = validateNewPassword(state.newPassword);
    } else if (field === "newPasswordConfirm") {
      error = validateNewPasswordConfirm(state.newPasswordConfirm);
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
    const currentPasswordError = validateCurrentPassword(state.currentPassword);
    const newPasswordError = validateNewPassword(state.newPassword);
    const newPasswordConfirmError = validateNewPasswordConfirm(state.newPasswordConfirm);

    if (currentPasswordError || newPasswordError || newPasswordConfirmError) {
      setState((prev) => ({
        ...prev,
        errors: {
          currentPassword: currentPasswordError,
          newPassword: newPasswordError,
          newPasswordConfirm: newPasswordConfirmError,
        },
      }));

      // Focus first error field
      if (currentPasswordError) {
        document.getElementById("currentPassword")?.focus();
      } else if (newPasswordError) {
        document.getElementById("newPassword")?.focus();
      } else if (newPasswordConfirmError) {
        document.getElementById("newPasswordConfirm")?.focus();
      }

      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, errors: {} }));

    try {
      // TODO: Wywołanie API /api/v1/auth/change-password
      // const response = await fetch("/api/v1/auth/change-password", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     currentPassword: state.currentPassword,
      //     newPassword: state.newPassword,
      //   }),
      // });

      // if (!response.ok) {
      //   const errorData = await response.json();
      //   if (errorData.message?.includes("nieprawidłowe")) {
      //     throw new Error("Aktualne hasło jest nieprawidłowe");
      //   }
      //   throw new Error(errorData.message || "Nie udało się zmienić hasła");
      // }

      // Sukces - pokazujemy toast i zamykamy dialog
      // toast.success("Hasło zostało zmienione");
      // handleClose();

      // Tymczasowo - symulacja sukcesu
      console.log("Change password attempt");
      alert("Zmiana hasła - UI gotowe! Backend będzie zaimplementowany później.");
      setState((prev) => ({ ...prev, isLoading: false }));
      handleClose();
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Zmień hasło
          </DialogTitle>
          <DialogDescription>
            Wprowadź aktualne hasło oraz nowe hasło, aby je zmienić.
          </DialogDescription>
        </DialogHeader>

        {state.errors.general && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Błąd</AlertTitle>
            <AlertDescription>{state.errors.general}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Aktualne hasło</Label>
            <PasswordInput
              id="currentPassword"
              value={state.currentPassword}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  currentPassword: e.target.value,
                  errors: { ...prev.errors, currentPassword: undefined },
                }))
              }
              onBlur={() => handleBlur("currentPassword")}
              placeholder="Wprowadź aktualne hasło"
              error={state.errors.currentPassword}
              disabled={state.isLoading}
              autoComplete="current-password"
            />
            {state.errors.currentPassword && (
              <p className="text-sm text-red-500 mt-1" role="alert">
                {state.errors.currentPassword}
              </p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nowe hasło</Label>
            <PasswordInput
              id="newPassword"
              value={state.newPassword}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  newPassword: e.target.value,
                  errors: { ...prev.errors, newPassword: undefined },
                }))
              }
              onBlur={() => handleBlur("newPassword")}
              placeholder="Minimum 8 znaków"
              error={state.errors.newPassword}
              disabled={state.isLoading}
              autoComplete="new-password"
            />
            {state.errors.newPassword && (
              <p className="text-sm text-red-500 mt-1" role="alert">
                {state.errors.newPassword}
              </p>
            )}
          </div>

          {/* New Password Confirm */}
          <div className="space-y-2">
            <Label htmlFor="newPasswordConfirm">Powtórz nowe hasło</Label>
            <PasswordInput
              id="newPasswordConfirm"
              value={state.newPasswordConfirm}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  newPasswordConfirm: e.target.value,
                  errors: { ...prev.errors, newPasswordConfirm: undefined },
                }))
              }
              onBlur={() => handleBlur("newPasswordConfirm")}
              placeholder="Powtórz nowe hasło"
              error={state.errors.newPasswordConfirm}
              disabled={state.isLoading}
              autoComplete="new-password"
            />
            {state.errors.newPasswordConfirm && (
              <p className="text-sm text-red-500 mt-1" role="alert">
                {state.errors.newPasswordConfirm}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={state.isLoading}
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={state.isLoading}>
              {state.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {state.isLoading ? "Zapisywanie..." : "Zmień hasło"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
