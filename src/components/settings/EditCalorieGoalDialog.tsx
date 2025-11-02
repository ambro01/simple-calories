/**
 * EditCalorieGoalDialog Component
 *
 * Dialog do edycji celu kalorycznego użytkownika.
 * Pozwala na ustawienie nowego celu dziennego, który będzie obowiązywał od jutra.
 * Zawiera walidację i obsługę błędów z API.
 */

import { useEffect } from "react";
import { Info, Loader2 } from "lucide-react";
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
import type { EditCalorieGoalDialogProps } from "@/types/settings.types";
import { useCalorieGoalForm } from "@/hooks/useCalorieGoalForm";

export function EditCalorieGoalDialog({ open, onOpenChange, currentGoal, onSuccess }: EditCalorieGoalDialogProps) {
  const form = useCalorieGoalForm(currentGoal);

  /**
   * Reset formularza przy otwieraniu dialogu
   */
  useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open]);

  /**
   * Obsługa submit formularza
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await form.submitGoal();

      // Sukces - wywołaj callback i zamknij dialog
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      // Błędy są obsługiwane w hooku (form.state.validationError lub form.state.apiError)
      console.error("Failed to save goal:", error);
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

  // Wyświetl aktualny cel (jeśli istnieje)
  const currentGoalDisplay = currentGoal ? `${currentGoal.daily_goal} kcal` : "Brak celu";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ustaw cel kaloryczny</DialogTitle>
          <DialogDescription>
            Aktualnie: <span className="font-semibold">{currentGoalDisplay}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {/* Info Alert */}
          <Alert className="mb-4 border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Nowy cel będzie obowiązywał od jutra. Rekomendowany zakres: 1200-3500 kcal dziennie.
            </AlertDescription>
          </Alert>

          {/* Goal Input Field */}
          <div className="space-y-2">
            <Label htmlFor="daily_goal">
              Nowy cel dzienny <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="daily_goal"
                type="number"
                min="1"
                max="10000"
                step="1"
                placeholder="np. 2000"
                value={form.state.goalValue}
                onChange={(e) => form.updateGoalValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={form.state.isSaving}
                className={form.state.validationError ? "border-destructive focus-visible:ring-destructive" : ""}
                aria-invalid={!!form.state.validationError}
                aria-describedby={form.state.validationError ? "goal-error" : undefined}
                autoFocus
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                kcal
              </span>
            </div>

            {/* Validation Error */}
            {form.state.validationError && (
              <p id="goal-error" className="text-sm text-destructive" role="alert">
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
              {form.state.isSaving ? "Zapisywanie..." : "Zapisz"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
