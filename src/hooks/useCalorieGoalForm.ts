/**
 * useCalorieGoalForm Hook (Refactored with React Hook Form)
 *
 * Hook zarządzający stanem formularza edycji celu kalorycznego.
 * Używa React Hook Form + Zod dla walidacji i zarządzania stanem.
 */

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { calorieGoalSchema, type CalorieGoalFormData } from "@/utils/validation/schemas";
import { calorieGoalService } from "@/services/calorieGoal.service";
import type { CalorieGoalResponseDTO } from "@/types";

type UseCalorieGoalFormReturn = {
  form: ReturnType<typeof useForm<CalorieGoalFormData>>;
  apiError: string | null;
  onSubmit: (e: React.FormEvent) => Promise<CalorieGoalResponseDTO>;
  isSubmitting: boolean;
  reset: () => void;
};

export function useCalorieGoalForm(currentGoal: CalorieGoalResponseDTO | null): UseCalorieGoalFormReturn {
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<CalorieGoalFormData>({
    resolver: zodResolver(calorieGoalSchema),
    defaultValues: {
      dailyGoal: currentGoal?.daily_goal || 2000,
    },
    mode: "onBlur", // Validate on blur for better UX
  });

  /**
   * Synchronizuje wartość początkową gdy currentGoal się zmieni
   */
  useEffect(() => {
    if (currentGoal?.daily_goal) {
      form.reset({
        dailyGoal: currentGoal.daily_goal,
      });
    }
  }, [currentGoal, form]);

  /**
   * Wysyła formularz do API
   */
  const handleSubmit = async (data: CalorieGoalFormData): Promise<CalorieGoalResponseDTO> => {
    setApiError(null);

    try {
      const result = await calorieGoalService.saveGoalForTomorrow(data.dailyGoal);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Nie udało się zapisać celu";
      setApiError(errorMessage);
      throw error; // Re-throw so caller knows it failed
    }
  };

  /**
   * Resetuje formularz do stanu początkowego
   */
  const reset = () => {
    form.reset({
      dailyGoal: currentGoal?.daily_goal || 2000,
    });
    setApiError(null);
  };

  return {
    form,
    apiError,
    onSubmit: form.handleSubmit(handleSubmit),
    isSubmitting: form.formState.isSubmitting,
    reset,
  };
}
