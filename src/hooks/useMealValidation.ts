/**
 * useMealValidation Hook
 *
 * Hook zarządzający pomocniczą logiką walidacji dla formularza posiłków.
 * Obsługuje auto-calculations, warnings, i category detection.
 */

import { useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { ManualMealFormData } from "@/utils/validation/schemas";
import {
  calculateMacroCalories,
  calculateMacroDifference,
  detectCategoryFromTime,
  getCurrentDate,
} from "@/lib/helpers/meal-form.utils";
import { VALIDATION_LIMITS } from "@/lib/constants/meal-form.constants";

export type MacroWarningInfo = {
  visible: true;
  calculatedCalories: number;
  providedCalories: number;
  differencePercent: number;
} | null;

export type DateWarningInfo = {
  type: "future" | "past";
  message: string;
} | null;

export type UseMealValidationReturn = {
  macroWarning: MacroWarningInfo;
  dateWarning: DateWarningInfo;
  autoCalculateCalories: () => void;
  autoDetectCategory: () => void;
};

export function useMealValidation(form: UseFormReturn<ManualMealFormData>): UseMealValidationReturn {
  // Watch relevant fields for reactive calculations
  const calories = form.watch("calories");
  const protein = form.watch("protein");
  const carbs = form.watch("carbs");
  const fats = form.watch("fats");
  const date = form.watch("date");
  const time = form.watch("time");
  const category = form.watch("category");

  /**
   * Calculate macro warning
   * Shows warning if difference between calculated and provided calories exceeds threshold
   */
  const macroWarning = useMemo((): MacroWarningInfo => {
    // Need all values to calculate
    if (!calories || (protein === null && carbs === null && fats === null)) {
      return null;
    }

    const calculated = calculateMacroCalories(protein, carbs, fats);
    const difference = calculateMacroDifference(calculated, calories);

    if (difference > VALIDATION_LIMITS.MACRO_WARNING_THRESHOLD) {
      return {
        visible: true,
        calculatedCalories: calculated,
        providedCalories: calories,
        differencePercent: difference,
      };
    }

    return null;
  }, [calories, protein, carbs, fats]);

  /**
   * Validate date field
   * Shows warning if date is in the future or too far in the past
   */
  const dateWarning = useMemo((): DateWarningInfo => {
    if (!date) return null;

    const today = getCurrentDate();
    const selectedDate = new Date(date);
    const todayDate = new Date(today);
    selectedDate.setHours(0, 0, 0, 0);
    todayDate.setHours(0, 0, 0, 0);

    // Future date - block submit
    if (selectedDate > todayDate) {
      return {
        type: "future",
        message: "Nie możesz dodać posiłku z przyszłości",
      };
    }

    // Past date - show info warning (doesn't block submit)
    const daysDiff = Math.floor((todayDate.getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 7) {
      return {
        type: "past",
        message: `Data sprzed ${daysDiff} dni. Upewnij się, że to prawidłowa data.`,
      };
    }

    return null;
  }, [date]);

  /**
   * Auto-calculate calories from macros
   * Overwrites current calories value with calculated value
   */
  const autoCalculateCalories = () => {
    const calculated = calculateMacroCalories(protein, carbs, fats);
    form.setValue("calories", calculated, { shouldValidate: true });
  };

  /**
   * Auto-detect category from time
   * Only sets category if not already manually selected
   */
  const autoDetectCategory = () => {
    if (!category && time) {
      const detected = detectCategoryFromTime(time);
      if (detected) {
        form.setValue("category", detected);
      }
    }
  };

  return {
    macroWarning,
    dateWarning,
    autoCalculateCalories,
    autoDetectCategory,
  };
}
