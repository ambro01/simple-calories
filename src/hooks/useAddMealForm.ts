/**
 * useAddMealForm Hook
 *
 * Main hook for managing AddMeal form state and logic.
 * Handles AI generation, validation, mode switching, and meal submission.
 *
 * @hook
 * @example
 * const form = useAddMealForm();
 *
 * // Use in component
 * <MealForm
 *   mode={form.state.mode}
 *   onGenerate={form.generateAI}
 *   onSubmit={form.submitMeal}
 * />
 */

import { useState, useCallback } from "react";
import type { MealFormState, MacroWarningInfo, FormValidationError } from "../types/add-meal.types";
import type { AIGenerationResponseDTO, CreateMealResponseDTO } from "../types";
import {
  getCurrentDate,
  getCurrentTime,
  calculateMacroCalories,
  calculateMacroDifference,
  detectCategoryFromTime,
} from "../lib/helpers/meal-form.utils";
import {
  validatePrompt,
  validateDescription,
  validateCalories,
  validateMacro,
  validateDate,
  validateAIGenerationId,
} from "../lib/validation/meal-form.validation";
import { VALIDATION_LIMITS } from "../lib/constants/meal-form.constants";

/**
 * Initial state for the form
 */
function getInitialState(initialDate?: string): MealFormState {
  return {
    mode: "ai",
    editMode: "create",
    editingMealId: null,
    description: "",
    calories: null,
    protein: null,
    carbs: null,
    fats: null,
    fiber: null,
    category: null,
    date: initialDate || getCurrentDate(),
    time: getCurrentTime(),
    aiPrompt: "",
    aiGenerationId: null,
    aiResult: null,
    aiLoading: false,
    aiLoadingStage: 0,
    aiError: null,
    submitLoading: false,
    submitError: null,
    loadingMeal: false,
    loadMealError: null,
    validationErrors: [],
    macroWarning: null,
    dateWarning: null,
  };
}

/**
 * Hook return type
 */
export type UseAddMealFormReturn = {
  state: MealFormState;

  // Mode switching
  setMode: (mode: "ai" | "manual") => void;
  switchToManual: (prepopulate: boolean) => void;
  switchToAI: () => void;

  // Field updates
  updateField: <K extends keyof MealFormState>(field: K, value: MealFormState[K]) => void;
  updatePrompt: (prompt: string) => void;

  // AI operations
  generateAI: () => Promise<void>;
  acceptAIResult: () => void;

  // Edit mode operations
  loadMealForEdit: (mealId: string) => Promise<void>;

  // Validation and helpers
  calculateMacroWarning: () => void;
  validateDateField: (date: string) => void;
  autoCalculateCalories: () => void;
  autoDetectCategory: (time: string) => void;

  // Submit
  validateForm: () => boolean;
  submitMeal: () => Promise<CreateMealResponseDTO>;

  // Reset
  reset: () => void;

  // Computed values
  isAIMode: boolean;
  isManualMode: boolean;
  canSubmit: boolean;
  hasAIResult: boolean;
};

export function useAddMealForm(initialDate?: string): UseAddMealFormReturn {
  const [state, setState] = useState<MealFormState>(getInitialState(initialDate));

  // Generic field update
  const updateField = useCallback(<K extends keyof MealFormState>(field: K, value: MealFormState[K]) => {
    setState((prev) => ({ ...prev, [field]: value }));

    // Auto-calculate macro warning when relevant fields change
    if (field === "calories" || field === "protein" || field === "carbs" || field === "fats") {
      setTimeout(() => calculateMacroWarning(), 0);
    }

    // Auto-validate date when it changes
    if (field === "date") {
      setTimeout(() => validateDateField(value as string), 0);
    }

    // Auto-detect category when time changes
    if (field === "time") {
      setTimeout(() => autoDetectCategory(value as string), 0);
    }

    // Clear validation errors when user modifies fields
    if (field === "description") {
      setState((prev) => ({
        ...prev,
        validationErrors: prev.validationErrors.filter((err) => err.field !== "description"),
      }));
    }

    if (field === "calories") {
      setState((prev) => ({
        ...prev,
        validationErrors: prev.validationErrors.filter((err) => err.field !== "calories"),
      }));
    }

    if (field === "protein" || field === "carbs" || field === "fats" || field === "fiber") {
      setState((prev) => ({
        ...prev,
        validationErrors: prev.validationErrors.filter((err) => err.field !== field),
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update prompt (AI mode)
  const updatePrompt = useCallback((prompt: string) => {
    setState((prev) => ({ ...prev, aiPrompt: prompt }));
  }, []);

  // Switch to manual mode
  const switchToManual = useCallback((prepopulate: boolean) => {
    setState((prev) => {
      const newState: Partial<MealFormState> = {
        mode: "manual",
        aiError: null,
      };

      if (prepopulate && prev.aiResult && prev.aiResult.status === "completed") {
        // Prepopulate with AI result
        newState.description = prev.aiPrompt;
        newState.calories = prev.aiResult.generated_calories;
        newState.protein = prev.aiResult.generated_protein;
        newState.carbs = prev.aiResult.generated_carbs;
        newState.fats = prev.aiResult.generated_fats;
      } else {
        // Keep description only
        newState.description = prev.aiPrompt || prev.description;
      }

      return { ...prev, ...newState };
    });

    // Recalculate warnings
    setTimeout(() => calculateMacroWarning(), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch to AI mode
  const switchToAI = useCallback(() => {
    setState((prev) => ({
      ...prev,
      mode: "ai",
      aiPrompt: prev.description || prev.aiPrompt,
      aiError: null,
    }));
  }, []);

  // Set mode directly
  const setMode = useCallback(
    (mode: "ai" | "manual") => {
      if (mode === "manual") {
        switchToManual(false);
      } else {
        switchToAI();
      }
    },
    [switchToManual, switchToAI]
  );

  // Generate AI meal estimation
  const generateAI = useCallback(async () => {
    const promptError = validatePrompt(state.aiPrompt);
    if (promptError) {
      setState((prev) => ({ ...prev, aiError: promptError.message }));
      return;
    }

    // Reset AI state
    setState((prev) => ({
      ...prev,
      aiLoading: true,
      aiLoadingStage: 0,
      aiError: null,
      aiResult: null,
      aiGenerationId: null,
    }));

    // Multi-stage loading simulation
    const stageTimer1 = setTimeout(() => {
      setState((prev) => ({ ...prev, aiLoadingStage: 1 }));
    }, 1000);

    const stageTimer2 = setTimeout(() => {
      setState((prev) => ({ ...prev, aiLoadingStage: 2 }));
    }, 2000);

    try {
      const response = await fetch("/api/v1/ai-generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: state.aiPrompt }),
      });

      // Handle rate limiting
      if (response.status === 429) {
        const errorData = await response.json();
        const retryAfter = errorData.retry_after || 60;
        setState((prev) => ({
          ...prev,
          aiLoading: false,
          aiError: `Zbyt wiele żądań. Spróbuj ponownie za ${retryAfter}s`,
        }));
        clearTimeout(stageTimer1);
        clearTimeout(stageTimer2);
        return;
      }

      if (!response.ok) {
        throw new Error("API error");
      }

      const result: AIGenerationResponseDTO = await response.json();

      if (result.status === "failed") {
        setState((prev) => ({
          ...prev,
          aiLoading: false,
          aiResult: result,
          aiError: null,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          aiLoading: false,
          aiResult: result,
          aiGenerationId: result.id,
          aiError: null,
        }));
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setState((prev) => ({
        ...prev,
        aiLoading: false,
        aiError: "Wystąpił błąd połączenia. Spróbuj ponownie.",
      }));
    } finally {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
    }
  }, [state.aiPrompt]);

  // Accept AI result and prepopulate form
  const acceptAIResult = useCallback(() => {
    if (!state.aiResult || state.aiResult.status !== "completed") return;

    setState((prev) => ({
      ...prev,
      description: prev.aiPrompt,
      calories: prev.aiResult?.generated_calories || null,
      protein: prev.aiResult?.generated_protein || null,
      carbs: prev.aiResult?.generated_carbs || null,
      fats: prev.aiResult?.generated_fats || null,
    }));

    // Calculate warnings
    setTimeout(() => calculateMacroWarning(), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.aiResult, state.aiPrompt]);

  // Load meal for editing
  const loadMealForEdit = useCallback(async (mealId: string) => {
    setState((prev) => ({
      ...prev,
      loadingMeal: true,
      loadMealError: null,
      editMode: "edit",
      editingMealId: mealId,
    }));

    try {
      const response = await fetch(`/api/v1/meals/${mealId}`);

      if (response.status === 404) {
        throw new Error("Meal not found");
      }

      if (!response.ok) {
        throw new Error("Failed to load meal");
      }

      const meal = await response.json();

      // Parse meal_timestamp to date and time
      const mealDate = new Date(meal.meal_timestamp);
      const date = mealDate.toISOString().split("T")[0]; // YYYY-MM-DD
      const hours = mealDate.getHours().toString().padStart(2, "0");
      const minutes = mealDate.getMinutes().toString().padStart(2, "0");
      const time = `${hours}:${minutes}`; // HH:MM

      // Set mode based on input_method
      // If meal was generated by AI, show AI mode; otherwise show manual mode
      const mode: "ai" | "manual" = meal.input_method === "ai" ? "ai" : "manual";

      setState((prev) => ({
        ...prev,
        mode,
        description: meal.description,
        aiPrompt: mode === "ai" ? meal.description : "", // Set aiPrompt for AI mode
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fats: meal.fats,
        fiber: null, // API nie zwraca fiber
        category: meal.category,
        date,
        time,
        loadingMeal: false,
        loadMealError: null,
      }));

      // Calculate warnings
      setTimeout(() => calculateMacroWarning(), 0);
      setTimeout(() => validateDateField(date), 0);
    } catch (error) {
      const errorMessage =
        error instanceof Error && error.message === "Meal not found"
          ? "Posiłek nie został znaleziony"
          : "Nie udało się wczytać posiłku. Spróbuj ponownie.";

      setState((prev) => ({
        ...prev,
        loadingMeal: false,
        loadMealError: errorMessage,
      }));
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate macro warning
  const calculateMacroWarning = useCallback(() => {
    setState((prev) => {
      const { calories, protein, carbs, fats } = prev;

      // Need all values to calculate
      if (calories === null || (protein === null && carbs === null && fats === null)) {
        return { ...prev, macroWarning: null };
      }

      const calculated = calculateMacroCalories(protein, carbs, fats);
      const difference = calculateMacroDifference(calculated, calories);

      if (difference > VALIDATION_LIMITS.MACRO_WARNING_THRESHOLD) {
        const warning: MacroWarningInfo = {
          visible: true,
          calculatedCalories: calculated,
          providedCalories: calories,
          differencePercent: difference,
        };
        return { ...prev, macroWarning: warning };
      }

      return { ...prev, macroWarning: null };
    });
  }, []);

  // Validate date field
  const validateDateField = useCallback((date: string) => {
    const warning = validateDate(date);
    setState((prev) => ({ ...prev, dateWarning: warning }));
  }, []);

  // Auto-calculate calories from macros
  const autoCalculateCalories = useCallback(() => {
    setState((prev) => {
      const calculated = calculateMacroCalories(prev.protein, prev.carbs, prev.fats);
      return { ...prev, calories: calculated, macroWarning: null };
    });
  }, []);

  // Auto-detect category from time
  const autoDetectCategory = useCallback((time: string) => {
    setState((prev) => {
      // Don't override if already manually selected
      if (prev.category !== null) return prev;

      const detected = detectCategoryFromTime(time);
      return { ...prev, category: detected };
    });
  }, []);

  // Validate entire form
  const validateForm = useCallback((): boolean => {
    const errors: FormValidationError[] = [];

    if (state.mode === "ai") {
      // AI mode validation - only check if we have AI result
      const aiIdError = validateAIGenerationId(state.aiGenerationId);
      if (aiIdError) errors.push(aiIdError);

      // Description and calories will be taken from aiResult during submit
      // So we only validate if aiResult exists
      if (!state.aiResult || state.aiResult.status !== "completed") {
        errors.push({
          field: "aiResult",
          message: "Najpierw wygeneruj posiłek",
        });
      }
    } else {
      // Manual mode validation
      const descError = validateDescription(state.description);
      if (descError) errors.push(descError);

      const calError = validateCalories(state.calories);
      if (calError) errors.push(calError);

      // Validate macros if provided
      if (state.protein !== null) {
        const proteinError = validateMacro(state.protein, "protein");
        if (proteinError) errors.push(proteinError);
      }
      if (state.carbs !== null) {
        const carbsError = validateMacro(state.carbs, "carbs");
        if (carbsError) errors.push(carbsError);
      }
      if (state.fats !== null) {
        const fatsError = validateMacro(state.fats, "fats");
        if (fatsError) errors.push(fatsError);
      }
      if (state.fiber !== null) {
        const fiberError = validateMacro(state.fiber, "fiber");
        if (fiberError) errors.push(fiberError);
      }
    }

    // Date validation (blocks submit if future)
    if (state.dateWarning?.type === "future") {
      errors.push({
        field: "date",
        message: state.dateWarning.message,
      });
    }

    setState((prev) => ({ ...prev, validationErrors: errors }));
    return errors.length === 0;
  }, [state]);

  // Submit meal
  const submitMeal = useCallback(async (): Promise<CreateMealResponseDTO> => {
    // For AI mode, prepare values from aiResult if not manually accepted
    let description = state.description;
    let calories = state.calories;
    let protein = state.protein;
    let carbs = state.carbs;
    let fats = state.fats;

    if (state.mode === "ai" && state.aiResult?.status === "completed") {
      // Use AI result values if form fields are empty
      if (!description) description = state.aiPrompt;
      if (calories === null) calories = state.aiResult.generated_calories;
      if (protein === null) protein = state.aiResult.generated_protein;
      if (carbs === null) carbs = state.aiResult.generated_carbs;
      if (fats === null) fats = state.aiResult.generated_fats;
    }

    // Validate with actual values
    const errors: FormValidationError[] = [];

    if (state.mode === "ai") {
      const aiIdError = validateAIGenerationId(state.aiGenerationId);
      if (aiIdError) errors.push(aiIdError);

      const descError = validateDescription(description);
      if (descError) errors.push(descError);

      const calError = validateCalories(calories);
      if (calError) errors.push(calError);
    } else {
      const descError = validateDescription(description);
      if (descError) errors.push(descError);

      const calError = validateCalories(calories);
      if (calError) errors.push(calError);

      if (protein !== null) {
        const proteinError = validateMacro(protein, "protein");
        if (proteinError) errors.push(proteinError);
      }
      if (carbs !== null) {
        const carbsError = validateMacro(carbs, "carbs");
        if (carbsError) errors.push(carbsError);
      }
      if (fats !== null) {
        const fatsError = validateMacro(fats, "fats");
        if (fatsError) errors.push(fatsError);
      }
      if (state.fiber !== null) {
        const fiberError = validateMacro(state.fiber, "fiber");
        if (fiberError) errors.push(fiberError);
      }
    }

    // Date validation
    if (state.dateWarning?.type === "future") {
      errors.push({
        field: "date",
        message: state.dateWarning.message,
      });
    }

    if (errors.length > 0) {
      setState((prev) => ({ ...prev, validationErrors: errors }));
      throw new Error("Formularz zawiera błędy");
    }

    setState((prev) => ({ ...prev, submitLoading: true, submitError: null, validationErrors: [] }));

    try {
      // Tworzymy timestamp w lokalnej strefie czasowej i konwertujemy na ISO
      const localDateTime = new Date(`${state.date}T${state.time}:00`);
      const timestamp = localDateTime.toISOString();

      // Determine if we're in edit mode
      const isEditMode = state.editMode === "edit";
      const url = isEditMode ? `/api/v1/meals/${state.editingMealId}` : "/api/v1/meals";
      const method = isEditMode ? "PATCH" : "POST";

      // Prepare request data
      let requestData: Record<string, unknown>;

      if (isEditMode) {
        // PATCH - only include fields to update (UpdateMealRequestDTO)
        requestData = {
          description: description,
          // calories is guaranteed to be non-null due to validation
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          calories: calories!,
          protein: protein,
          carbs: carbs,
          fats: fats,
          category: state.category,
          meal_timestamp: timestamp,
        };
      } else {
        // POST - include input_method and ai_generation_id (CreateMealRequestDTO)
        requestData =
          state.mode === "ai"
            ? {
                description: description,
                // calories and ai_generation_id are guaranteed to be non-null due to validation
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                calories: calories!,
                protein: protein,
                carbs: carbs,
                fats: fats,
                category: state.category,
                input_method: "ai" as const,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                ai_generation_id: state.aiGenerationId!,
                meal_timestamp: timestamp,
              }
            : {
                description: description,
                // calories is guaranteed to be non-null due to validation
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                calories: calories!,
                protein: protein,
                carbs: carbs,
                fats: fats,
                category: state.category,
                input_method: "manual" as const,
                meal_timestamp: timestamp,
              };
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (response.status === 400) {
        const errorData = await response.json();
        const errors = Object.entries(errorData.details || {}).map(([field, message]) => ({
          field,
          message: message as string,
        }));
        setState((prev) => ({
          ...prev,
          submitLoading: false,
          validationErrors: errors,
        }));
        throw new Error("Błędy walidacji");
      }

      if (response.status === 404) {
        const errorMessage = isEditMode
          ? "Posiłek nie został znaleziony. Możliwe że został usunięty."
          : "Nie znaleziono generacji AI. Spróbuj wygenerować ponownie.";
        setState((prev) => ({
          ...prev,
          submitLoading: false,
          submitError: errorMessage,
        }));
        throw new Error(isEditMode ? "Meal not found" : "AI generation not found");
      }

      if (!response.ok) {
        throw new Error("API error");
      }

      const result: CreateMealResponseDTO = await response.json();

      setState((prev) => ({ ...prev, submitLoading: false }));

      return result;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        submitLoading: false,
        submitError: "Nie udało się zapisać posiłku. Spróbuj ponownie.",
      }));
      throw error;
    }
  }, [state]);

  // Reset form
  const reset = useCallback(() => {
    setState(getInitialState());
  }, []);

  // Computed values
  const isAIMode = state.mode === "ai";
  const isManualMode = state.mode === "manual";
  const canSubmit = !state.submitLoading && state.validationErrors.length === 0 && state.dateWarning?.type !== "future";
  const hasAIResult = state.aiResult !== null && state.aiResult.status === "completed";

  return {
    state,
    setMode,
    switchToManual,
    switchToAI,
    updateField,
    updatePrompt,
    generateAI,
    acceptAIResult,
    loadMealForEdit,
    calculateMacroWarning,
    validateDateField,
    autoCalculateCalories,
    autoDetectCategory,
    validateForm,
    submitMeal,
    reset,
    isAIMode,
    isManualMode,
    canSubmit,
    hasAIResult,
  };
}
