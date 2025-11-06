/**
 * MealForm Component
 *
 * Main form orchestrator that manages all sub-components and form logic.
 * Uses useAddMealForm hook for state management.
 *
 * @component
 * @example
 * <MealForm
 *   onClose={() => closeModal()}
 *   onSuccess={(meal) => {
 *     refreshMeals();
 *     toast.success('Posiłek dodany');
 *   }}
 * />
 */

import { useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import type { AIGenerationDTO, MealFormProps } from "../../types/add-meal.types";
import { useAddMealForm } from "../../hooks/useAddMealForm";
import { SegmentedControl } from "./SegmentedControl";
import { AIMode } from "./ai-mode/AIMode";
import { ManualMode } from "./manual-mode/ManualMode";
import { CommonFields } from "./common-fields/CommonFields";
import { FormActions } from "./FormActions";
import { LoadingOverlay } from "./LoadingOverlay";

export function MealForm({ onClose, onSuccess, mealId, initialDate }: MealFormProps) {
  const form = useAddMealForm(initialDate);

  // Load meal data for editing
  useEffect(() => {
    if (mealId) {
      form.loadMealForEdit(mealId).catch((error) => {
        console.error("Failed to load meal for editing:", error);
        // Error is already set in form state, LoadingOverlay will be hidden
        // and error message will be displayed
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mealId]);

  const handleSubmit = async () => {
    try {
      console.log("📝 [MealForm] handleSubmit START");
      const result = await form.submitMeal();
      console.log("📝 [MealForm] submitMeal SUCCESS, calling onSuccess callback", result);
      await onSuccess(result);
      console.log("📝 [MealForm] onSuccess callback completed");
      // onClose is now called by the parent component after refetch
    } catch (error) {
      // Errors are handled inside the hook
      console.error("❌ [MealForm] Failed to submit meal:", error);
    }
  };

  const handleSwitchToManual = () => {
    form.switchToManual(true);
  };

  const handleFieldChange = (field: string, value: unknown) => {
    form.updateField(field as keyof typeof form.state, value as string | number | null | AIGenerationDTO);
  };

  return (
    <div className="relative space-y-6">
      {/* Loading Overlay - shown while loading meal for edit */}
      {form.state.loadingMeal && <LoadingOverlay />}

      {/* Load Error */}
      {form.state.loadMealError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{form.state.loadMealError}</div>
      )}

      {/* Mode Selector */}
      <div className="flex justify-center">
        <SegmentedControl value={form.state.mode} onChange={form.setMode} disabled={form.state.submitLoading} />
      </div>

      {/* AI Mode */}
      {form.isAIMode && (
        <AIMode
          prompt={form.state.aiPrompt}
          onPromptChange={form.updatePrompt}
          aiResult={form.state.aiResult}
          aiLoading={form.state.aiLoading}
          aiLoadingStage={form.state.aiLoadingStage}
          aiError={form.state.aiError}
          onGenerate={form.generateAI}
          onAcceptResult={form.acceptAIResult}
          onRegenerate={form.generateAI}
          onSwitchToManual={handleSwitchToManual}
        />
      )}

      {/* Manual Mode */}
      {form.isManualMode && (
        <ManualMode
          description={form.state.description}
          calories={form.state.calories}
          protein={form.state.protein}
          carbs={form.state.carbs}
          fats={form.state.fats}
          fiber={form.state.fiber}
          macroWarning={form.state.macroWarning}
          onFieldChange={handleFieldChange}
          onAutoCalculate={form.autoCalculateCalories}
          validationErrors={form.state.validationErrors}
        />
      )}

      {/* Separator */}
      <Separator />

      {/* Common Fields */}
      <CommonFields
        category={form.state.category}
        date={form.state.date}
        time={form.state.time}
        dateWarning={form.state.dateWarning}
        onCategoryChange={(category) => form.updateField("category", category)}
        onDateChange={(date) => form.updateField("date", date)}
        onTimeChange={(time) => form.updateField("time", time)}
      />

      {/* Submit Error */}
      {form.state.submitError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{form.state.submitError}</div>
      )}

      {/* Form Actions */}
      <FormActions
        onCancel={onClose}
        onSubmit={handleSubmit}
        submitDisabled={!form.canSubmit}
        submitLoading={form.state.submitLoading}
        editMode={form.state.editMode}
      />
    </div>
  );
}
