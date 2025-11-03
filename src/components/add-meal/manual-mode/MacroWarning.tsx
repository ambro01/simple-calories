/**
 * MacroWarning Component
 *
 * Displays a warning alert when calculated calories from macronutrients
 * differ by more than 5% from the provided calories.
 *
 * Includes an auto-calculate button that sets calories to the calculated value.
 *
 * @component
 * @example
 * <MacroWarning
 *   calculatedCalories={540}
 *   providedCalories={650}
 *   differencePercent={0.17}
 *   onAutoCalculate={() => setCalories(540)}
 * />
 */

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import type { MacroWarningProps } from "../../../types/add-meal.types";
import { formatPercentDifference } from "../../../lib/helpers/meal-form.utils";

export function MacroWarning({
  calculatedCalories,
  providedCalories,
  differencePercent,
  onAutoCalculate,
}: MacroWarningProps) {
  return (
    <Alert variant="warning" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
      <AlertDescription className="space-y-3">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          Suma kalorii z makroskładników ({calculatedCalories} kcal) różni się o{" "}
          {formatPercentDifference(differencePercent)} od podanych kalorii ({providedCalories} kcal). Sprawdź
          wprowadzone wartości.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAutoCalculate}
          className="border-yellow-600 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-500 dark:text-yellow-400 dark:hover:bg-yellow-900/30"
        >
          Przelicz automatycznie
        </Button>
      </AlertDescription>
    </Alert>
  );
}
