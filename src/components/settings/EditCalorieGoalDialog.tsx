/**
 * EditCalorieGoalDialog Component (Refactored with React Hook Form)
 *
 * Dialog do edycji celu kalorycznego użytkownika.
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { EditCalorieGoalDialogProps } from "@/types/settings.types";
import { useCalorieGoalForm } from "@/hooks/useCalorieGoalForm";

export function EditCalorieGoalDialog({
  open,
  onOpenChange,
  currentGoal,
  tomorrowGoal,
  onSuccess,
}: EditCalorieGoalDialogProps) {
  // Użyj celu na jutro jeśli istnieje, w przeciwnym razie aktualnego
  const goalToEdit = tomorrowGoal || currentGoal;
  const { form, apiError, onSubmit, isSubmitting, reset } = useCalorieGoalForm(goalToEdit);

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
      console.error("Failed to save goal:", error);
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

  /**
   * Obsługa klawisza Enter w polu input
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isSubmitting) {
      handleSubmit(e);
    }
  };

  // Wyświetl aktualny cel (jeśli istnieje)
  const currentGoalDisplay = currentGoal ? `${currentGoal.daily_goal} kcal` : "Brak celu";
  const tomorrowGoalDisplay = tomorrowGoal ? `${tomorrowGoal.daily_goal} kcal` : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ustaw cel kaloryczny</DialogTitle>
          <DialogDescription>
            {tomorrowGoal && tomorrowGoal.daily_goal !== currentGoal?.daily_goal ? (
              <>
                Aktualnie: <span className="font-semibold">{currentGoalDisplay}</span>
                <br />
                Od jutra: <span className="font-semibold">{tomorrowGoalDisplay}</span>
              </>
            ) : (
              <>
                Aktualnie: <span className="font-semibold">{currentGoalDisplay}</span>
              </>
            )}
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
                {...form.register("dailyGoal")}
                onKeyDown={handleKeyDown}
                disabled={isSubmitting}
                className={form.formState.errors.dailyGoal ? "border-destructive focus-visible:ring-destructive" : ""}
                aria-invalid={!!form.formState.errors.dailyGoal}
                aria-describedby={form.formState.errors.dailyGoal ? "goal-error" : undefined}
                autoFocus // eslint-disable-line jsx-a11y/no-autofocus -- Dialog focus management
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                kcal
              </span>
            </div>

            {/* Validation Error */}
            {form.formState.errors.dailyGoal && (
              <p id="goal-error" className="text-sm text-destructive" role="alert">
                {form.formState.errors.dailyGoal.message}
              </p>
            )}
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
              {isSubmitting ? "Zapisywanie..." : "Zapisz"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
