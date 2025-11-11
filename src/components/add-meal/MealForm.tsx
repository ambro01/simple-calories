/**
 * MealForm Component (Refactored with React Hook Form)
 *
 * Main form orchestrator using new architecture:
 * - React Hook Form for state management
 * - useMealForm for orchestration
 * - Separated concerns (AI, validation, edit)
 */

import { useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import type { MealFormProps } from "../../types/add-meal.types";
import { useMealForm } from "../../hooks/useMealForm";
import { SegmentedControl } from "./SegmentedControl";
import { AIMode } from "./ai-mode/AIMode";
import { ManualMode } from "./manual-mode/ManualMode";
import { CommonFields } from "./common-fields/CommonFields";
import { FormActions } from "./FormActions";
import { LoadingOverlay } from "./LoadingOverlay";

export function MealForm({ onClose, onSuccess, mealId, initialDate }: MealFormProps) {
  const mealForm = useMealForm(initialDate);

  // Load meal data for editing
  useEffect(() => {
    if (mealId) {
      // eslint-disable-next-line no-console -- Error logging for debugging
      mealForm.loadMealForEdit(mealId).catch((error) => console.error("Failed to load meal for editing:", error));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mealId]);

  const handleSubmit = async () => {
    try {
      const result = await mealForm.submitMeal();
      await onSuccess(result);
      // onClose is now called by the parent component after refetch
    } catch (error) {
      // Errors are handled inside the hook
      // eslint-disable-next-line no-console -- Error logging for debugging
      console.error("❌ [MealForm] Failed to submit meal:", error);
    }
  };

  const handleSwitchToManual = () => {
    mealForm.switchToManual(true);
  };

  // Get active form based on mode
  const activeForm = mealForm.mode === "manual" ? mealForm.manualForm : mealForm.aiForm;

  return (
    <div className="relative space-y-6">
      {/* Loading Overlay - shown while loading meal for edit */}
      {mealForm.edit.loadingMeal && <LoadingOverlay />}

      {/* Load Error */}
      {mealForm.edit.loadMealError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{mealForm.edit.loadMealError}</div>
      )}

      {/* Mode Selector */}
      <div className="flex justify-center">
        <SegmentedControl value={mealForm.mode} onChange={mealForm.setMode} disabled={mealForm.submitLoading} />
      </div>

      {/* AI Mode */}
      {mealForm.mode === "ai" && (
        <AIMode form={mealForm.aiForm} ai={mealForm.ai} onSwitchToManual={handleSwitchToManual} />
      )}

      {/* Manual Mode */}
      {mealForm.mode === "manual" && mealForm.validation && (
        <ManualMode form={mealForm.manualForm} validation={mealForm.validation} />
      )}

      {/* Separator */}
      <Separator />

      {/* Common Fields */}
      <CommonFields
        category={activeForm.watch("category")}
        date={activeForm.watch("date")}
        time={activeForm.watch("time")}
        dateWarning={mealForm.validation?.dateWarning || null}
        onCategoryChange={(category) => activeForm.setValue("category", category, { shouldDirty: true })}
        onDateChange={(date) => activeForm.setValue("date", date, { shouldDirty: true })}
        onTimeChange={(time) => activeForm.setValue("time", time, { shouldDirty: true })}
      />

      {/* Submit Error */}
      {mealForm.submitError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{mealForm.submitError}</div>
      )}

      {/* Form Actions */}
      <FormActions
        onCancel={onClose}
        onSubmit={handleSubmit}
        submitDisabled={!mealForm.canSubmit}
        submitLoading={mealForm.submitLoading}
        editMode={mealForm.editMode}
      />
    </div>
  );
}
