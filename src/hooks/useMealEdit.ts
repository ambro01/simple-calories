/**
 * useMealEdit Hook
 *
 * Hook zarządzający logiką edit mode dla formularza posiłków.
 * Obsługuje ładowanie istniejącego posiłku i prepopulację formularza.
 */

import { useState, useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { ManualMealFormData, AIMealFormData } from "@/utils/validation/schemas";
import { mealService } from "@/services/meal.service";

type UseMealEditReturn = {
  loadingMeal: boolean;
  loadMealError: string | null;
  loadMealForEdit: (
    mealId: string,
    form: UseFormReturn<ManualMealFormData> | UseFormReturn<AIMealFormData>,
    mode: "ai" | "manual"
  ) => Promise<void>;
};

export function useMealEdit(): UseMealEditReturn {
  const [loadingMeal, setLoadingMeal] = useState(false);
  const [loadMealError, setLoadMealError] = useState<string | null>(null);

  /**
   * Load meal for editing
   * Fetches meal data and populates form with values
   */
  const loadMealForEdit = useCallback(
    async (
      mealId: string,
      form: UseFormReturn<ManualMealFormData> | UseFormReturn<AIMealFormData>,
      mode: "ai" | "manual"
    ) => {
      setLoadingMeal(true);
      setLoadMealError(null);

      try {
        const meal = await mealService.getMealById(mealId);

        // Parse meal_timestamp to date and time
        const mealDate = new Date(meal.meal_timestamp);
        const date = mealDate.toISOString().split("T")[0]; // YYYY-MM-DD
        const hours = mealDate.getHours().toString().padStart(2, "0");
        const minutes = mealDate.getMinutes().toString().padStart(2, "0");
        const time = `${hours}:${minutes}`; // HH:MM

        // Populate form based on mode
        if (mode === "manual") {
          const manualForm = form as UseFormReturn<ManualMealFormData>;
          manualForm.reset({
            description: meal.description,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fats: meal.fats,
            fiber: null, // API doesn't return fiber
            category: meal.category,
            date,
            time,
          });
        } else {
          // AI mode
          const aiForm = form as UseFormReturn<AIMealFormData>;
          aiForm.reset({
            aiPrompt: meal.description,
            category: meal.category,
            date,
            time,
          });
        }

        setLoadingMeal(false);
      } catch (error) {
        const errorMessage =
          error instanceof Error && error.message === "Posiłek nie został znaleziony"
            ? "Posiłek nie został znaleziony"
            : "Nie udało się wczytać posiłku. Spróbuj ponownie.";

        setLoadMealError(errorMessage);
        setLoadingMeal(false);
        throw error;
      }
    },
    []
  );

  return {
    loadingMeal,
    loadMealError,
    loadMealForEdit,
  };
}
