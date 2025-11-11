/**
 * ManualMode Component (Refactored with React Hook Form)
 *
 * Interface for manual meal entry with React Hook Form integration.
 */

import type { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import type { ManualMealFormData } from "@/utils/validation/schemas";
import type { UseMealValidationReturn } from "@/hooks/useMealValidation";
import { CharacterCounter } from "../CharacterCounter";
import { MacroInputs } from "./MacroInputs";
import { MacroWarning } from "./MacroWarning";
import { VALIDATION_LIMITS } from "../../../lib/constants/meal-form.constants";

type ManualModeProps = {
  form: UseFormReturn<ManualMealFormData>;
  validation: UseMealValidationReturn;
};

export function ManualMode({ form, validation }: ManualModeProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = form;
  const description = watch("description");

  return (
    <div className="space-y-4" data-testid="manual-mode-form">
      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="manual-description" className="text-sm font-medium">
          Opis posiłku <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="manual-description"
          {...register("description")}
          placeholder="np. Kurczak z ryżem i warzywami"
          maxLength={VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH}
          rows={3}
          className={`resize-none ${errors.description ? "border-destructive" : ""}`}
          data-testid="manual-description-input"
        />
        <div className="flex items-center justify-between">
          <CharacterCounter current={description.length} max={VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH} />
          {errors.description && <span className="text-xs text-destructive">{errors.description.message}</span>}
        </div>
      </div>

      {/* Calories */}
      <div className="space-y-2">
        <Label htmlFor="manual-calories" className="text-sm font-medium">
          Kalorie <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="manual-calories"
            type="number"
            min={VALIDATION_LIMITS.CALORIES_MIN}
            max={VALIDATION_LIMITS.CALORIES_MAX}
            {...register("calories")}
            placeholder="0"
            className={errors.calories ? "border-destructive" : ""}
            data-testid="manual-calories-input"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kcal</span>
        </div>
        {errors.calories && <p className="text-xs text-destructive">{errors.calories.message}</p>}
      </div>

      {/* Macronutrients */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Makroskładniki</Label>
        <MacroInputs
          protein={watch("protein")}
          carbs={watch("carbs")}
          fats={watch("fats")}
          fiber={watch("fiber")}
          onChange={(field, value) => {
            form.setValue(field as keyof ManualMealFormData, value, { shouldValidate: true, shouldDirty: true });
          }}
          errors={{
            protein: errors.protein?.message,
            carbs: errors.carbs?.message,
            fats: errors.fats?.message,
            fiber: errors.fiber?.message,
          }}
        />
      </div>

      {/* Macro Warning */}
      {validation.macroWarning && (
        <MacroWarning
          calculatedCalories={validation.macroWarning.calculatedCalories}
          providedCalories={validation.macroWarning.providedCalories}
          differencePercent={validation.macroWarning.differencePercent}
          onAutoCalculate={validation.autoCalculateCalories}
        />
      )}
    </div>
  );
}
