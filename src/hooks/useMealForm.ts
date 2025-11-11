/**
 * useMealForm Hook (New Orchestrator with React Hook Form)
 *
 * Main orchestrator hook for MealForm using React Hook Form.
 * Manages mode switching, AI generation, validation, and submission.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  manualMealSchema,
  aiMealSchema,
  type ManualMealFormData,
  type AIMealFormData,
} from "@/utils/validation/schemas";
import { useMealAI } from "./useMealAI";
import { useMealValidation } from "./useMealValidation";
import { useMealEdit } from "./useMealEdit";
import { mealService, ApiError } from "@/services/meal.service";
import { getCurrentDate, getCurrentTime } from "@/lib/helpers/meal-form.utils";
import type {
  CreateMealResponseDTO,
  CreateAIMealRequestDTO,
  CreateManualMealRequestDTO,
  UpdateMealRequestDTO,
} from "@/types";

type MealMode = "ai" | "manual";
type EditMode = "create" | "edit";

type UseMealFormReturn = {
  // Mode state
  mode: MealMode;
  editMode: EditMode;
  editingMealId: string | null;
  setMode: (mode: MealMode) => void;
  switchToManual: (prepopulateFromAI: boolean) => void;

  // Forms
  manualForm: ReturnType<typeof useForm<ManualMealFormData>>;
  aiForm: ReturnType<typeof useForm<AIMealFormData>>;

  // AI hook
  ai: ReturnType<typeof useMealAI>;

  // Validation hook (only for manual mode)
  validation: ReturnType<typeof useMealValidation> | null;

  // Edit hook
  edit: ReturnType<typeof useMealEdit>;

  // Submit state
  submitLoading: boolean;
  submitError: string | null;

  // Submit function
  submitMeal: () => Promise<CreateMealResponseDTO>;

  // Load meal for edit
  loadMealForEdit: (mealId: string) => Promise<void>;

  // Computed
  canSubmit: boolean;
};

export function useMealForm(initialDate?: string): UseMealFormReturn {
  const [mode, setModeState] = useState<MealMode>("ai");
  const [editMode, setEditMode] = useState<EditMode>("create");
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initialize forms
  const manualForm = useForm<ManualMealFormData>({
    resolver: zodResolver(manualMealSchema),
    defaultValues: {
      description: "",
      calories: undefined,
      protein: null,
      carbs: null,
      fats: null,
      fiber: null,
      category: null,
      date: initialDate || getCurrentDate(),
      time: getCurrentTime(),
    },
    mode: "onChange",
  });

  const aiForm = useForm<AIMealFormData>({
    resolver: zodResolver(aiMealSchema),
    defaultValues: {
      aiPrompt: "",
      category: null,
      date: initialDate || getCurrentDate(),
      time: getCurrentTime(),
    },
    mode: "onChange",
  });

  // Initialize hooks
  const ai = useMealAI();
  // Always call hooks unconditionally (React rules)
  const validationHook = useMealValidation(manualForm);
  const validation = mode === "manual" ? validationHook : null;
  const edit = useMealEdit();

  // Auto-detect category when time changes (manual mode)
  const timeValue = manualForm.watch("time");
  useEffect(() => {
    if (mode === "manual" && validation) {
      validation.autoDetectCategory();
    }
  }, [timeValue, mode, validation]);

  /**
   * Switch mode
   */
  const setMode = useCallback((newMode: MealMode) => {
    setModeState(newMode);
    setSubmitError(null);
  }, []);

  /**
   * Switch to manual mode (from AI)
   * Optionally prepopulate with AI result
   */
  const switchToManual = useCallback(
    (prepopulateFromAI: boolean) => {
      setModeState("manual");
      setSubmitError(null);

      if (prepopulateFromAI && ai.aiResult?.status === "completed") {
        // Prepopulate manual form with AI result
        manualForm.reset({
          description: aiForm.getValues("aiPrompt"),
          calories: ai.aiResult.generated_calories ?? undefined,
          protein: ai.aiResult.generated_protein,
          carbs: ai.aiResult.generated_carbs,
          fats: ai.aiResult.generated_fats,
          fiber: null,
          category: aiForm.getValues("category"),
          date: aiForm.getValues("date"),
          time: aiForm.getValues("time"),
        });
      } else {
        // Just copy prompt as description
        manualForm.setValue("description", aiForm.getValues("aiPrompt"));
      }
    },
    [ai.aiResult, aiForm, manualForm]
  );

  /**
   * Load meal for editing
   */
  const loadMealForEdit = useCallback(
    async (mealId: string) => {
      setEditMode("edit");
      setEditingMealId(mealId);

      // Fetch meal
      const meal = await mealService.getMealById(mealId);

      // Determine mode from input_method
      const mealMode: MealMode = meal.input_method === "ai" ? "ai" : "manual";
      setModeState(mealMode);

      // Load into appropriate form
      await edit.loadMealForEdit(mealId, mealMode === "manual" ? manualForm : aiForm, mealMode);
    },
    [edit, manualForm, aiForm]
  );

  /**
   * Submit meal (create or update)
   */
  const submitMeal = useCallback(async (): Promise<CreateMealResponseDTO> => {
    setSubmitLoading(true);
    setSubmitError(null);

    try {
      if (mode === "ai") {
        // Validate AI form
        const isValid = await aiForm.trigger();
        if (!isValid) {
          throw new Error("Formularz zawiera błędy");
        }

        const aiData = aiForm.getValues();

        // Prepare request data - convert local time to UTC
        const localDateTime = new Date(`${aiData.date}T${aiData.time}:00`);
        const timestamp = localDateTime.toISOString();

        if (editMode === "edit" && editingMealId) {
          // In edit mode: use new AI result if available, otherwise use original data
          const hasNewAIResult = ai.aiResult?.status === "completed";

          // Determine which data to use
          let calories: number;
          let protein: number | null;
          let carbs: number | null;
          let fats: number | null;

          if (hasNewAIResult && ai.aiResult) {
            // Use new AI result
            calories = ai.aiResult.generated_calories;
            protein = ai.aiResult.generated_protein;
            carbs = ai.aiResult.generated_carbs;
            fats = ai.aiResult.generated_fats;
          } else if (edit.originalMealData) {
            // Use original data from loaded meal
            calories = edit.originalMealData.calories;
            protein = edit.originalMealData.protein;
            carbs = edit.originalMealData.carbs;
            fats = edit.originalMealData.fats;
          } else {
            throw new Error("Brak danych do zapisu");
          }

          // Update meal
          const updateData: UpdateMealRequestDTO = {
            description: aiData.aiPrompt,
            calories,
            protein,
            carbs,
            fats,
            meal_timestamp: timestamp,
          };

          // Only add category if it's not null
          if (aiData.category !== null) {
            updateData.category = aiData.category;
          }

          const result = await mealService.updateMeal(editingMealId, updateData);
          return result as CreateMealResponseDTO;
        } else {
          // In create mode: must have AI result
          if (!ai.aiResult || ai.aiResult.status !== "completed") {
            throw new Error("Najpierw wygeneruj wynik AI");
          }

          // TypeScript narrowing: ai.aiResult is guaranteed to be non-null here
          const aiResult = ai.aiResult;

          // Create meal
          const mealData: CreateAIMealRequestDTO = {
            description: aiData.aiPrompt,
            calories: aiResult.generated_calories,
            protein: aiResult.generated_protein,
            carbs: aiResult.generated_carbs,
            fats: aiResult.generated_fats,
            input_method: "ai",
            ai_generation_id: aiResult.id,
            meal_timestamp: timestamp,
          };

          // Only add category if it's not null
          if (aiData.category !== null) {
            mealData.category = aiData.category;
          }

          return await mealService.createMeal(mealData);
        }
      } else {
        // Manual mode
        const isValid = await manualForm.trigger();
        if (!isValid) {
          throw new Error("Formularz zawiera błędy");
        }

        // Check date warning (future date blocks submit)
        if (validation?.dateWarning?.type === "future") {
          throw new Error(validation.dateWarning.message);
        }

        const manualData = manualForm.getValues();

        // Prepare request data - convert local time to UTC
        const localDateTime = new Date(`${manualData.date}T${manualData.time}:00`);
        const timestamp = localDateTime.toISOString();

        // Ensure calories is a number (React Hook Form may return string from number input)
        const calories =
          typeof manualData.calories === "string" ? Number(manualData.calories) : (manualData.calories ?? 0);

        if (editMode === "edit" && editingMealId) {
          // Update meal
          const updateData: UpdateMealRequestDTO = {
            description: manualData.description,
            calories,
            protein: manualData.protein,
            carbs: manualData.carbs,
            fats: manualData.fats,
            meal_timestamp: timestamp,
          };

          // Only add category if it's not null
          if (manualData.category !== null) {
            updateData.category = manualData.category;
          }

          const result = await mealService.updateMeal(editingMealId, updateData);
          return result as CreateMealResponseDTO;
        } else {
          // Create meal
          const mealData: CreateManualMealRequestDTO = {
            description: manualData.description,
            calories,
            protein: manualData.protein,
            carbs: manualData.carbs,
            fats: manualData.fats,
            input_method: "manual",
            meal_timestamp: timestamp,
          };

          // Only add category if it's not null
          if (manualData.category !== null) {
            mealData.category = manualData.category;
          }

          return await mealService.createMeal(mealData);
        }
      }
    } catch (error) {
      if (error instanceof ApiError) {
        // Set form errors from API
        const form = mode === "manual" ? manualForm : aiForm;
        Object.entries(error.details || {}).forEach(([field, message]) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          form.setError(field as any, { message });
        });
        setSubmitError("Popraw błędy w formularzu");
      } else {
        const errorMessage = error instanceof Error ? error.message : "Nie udało się zapisać posiłku";
        setSubmitError(errorMessage);
      }
      throw error;
    } finally {
      setSubmitLoading(false);
    }
  }, [mode, editMode, editingMealId, ai.aiResult, manualForm, aiForm, validation, edit.originalMealData]);

  /**
   * Can submit check
   */
  const canSubmit = useMemo(() => {
    if (submitLoading) return false;
    if (edit.loadingMeal) return false;
    if (validation?.dateWarning?.type === "future") return false;

    if (mode === "ai") {
      // In AI mode, must have successful AI result OR editing existing meal
      const hasAIResult = ai.aiResult?.status === "completed" && !ai.aiLoading;

      // In edit mode, allow submit if:
      // 1. Form is dirty (changed) AND no errors
      // 2. Either has new AI result OR has original meal data (editing without regenerating)
      if (editMode === "edit") {
        const hasData = hasAIResult || edit.originalMealData !== null;
        return aiForm.formState.isDirty && Object.keys(aiForm.formState.errors).length === 0 && hasData;
      }

      // In create mode, must have AI result
      return hasAIResult;
    } else {
      // In manual mode
      const formState = manualForm.formState;

      // In edit mode, allow submit if form is dirty (changed) and has no errors
      if (editMode === "edit") {
        return formState.isDirty && Object.keys(formState.errors).length === 0;
      }

      // In create mode, check form validity
      return formState.isValid;
    }
  }, [
    submitLoading,
    edit.loadingMeal,
    edit.originalMealData,
    validation?.dateWarning,
    mode,
    editMode,
    ai.aiResult,
    ai.aiLoading,
    aiForm.formState.isDirty,
    aiForm.formState.errors,
    manualForm.formState,
  ]);

  return {
    mode,
    editMode,
    editingMealId,
    setMode,
    switchToManual,
    manualForm,
    aiForm,
    ai,
    validation,
    edit,
    submitLoading,
    submitError,
    submitMeal,
    loadMealForEdit,
    canSubmit,
  };
}
