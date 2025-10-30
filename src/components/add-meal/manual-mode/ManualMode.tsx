/**
 * ManualMode Component
 *
 * Interface for manual meal entry including:
 * - Textarea for meal description
 * - Calories input (required)
 * - Macronutrient inputs (optional)
 * - Macro warning when calories don't match macros
 *
 * @component
 * @example
 * <ManualMode
 *   description={description}
 *   calories={calories}
 *   protein={protein}
 *   carbs={carbs}
 *   fats={fats}
 *   fiber={fiber}
 *   macroWarning={warning}
 *   onFieldChange={(field, value) => updateField(field, value)}
 *   onAutoCalculate={handleAutoCalculate}
 *   validationErrors={errors}
 * />
 */

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import type { ManualModeProps } from '../../../types/add-meal.types';
import { CharacterCounter } from '../CharacterCounter';
import { MacroInputs } from './MacroInputs';
import { MacroWarning } from './MacroWarning';
import { VALIDATION_LIMITS } from '../../../lib/constants/meal-form.constants';

export function ManualMode({
  description,
  calories,
  protein,
  carbs,
  fats,
  fiber,
  macroWarning,
  onFieldChange,
  onAutoCalculate,
  validationErrors,
}: ManualModeProps) {
  // Extract errors for specific fields
  const getFieldError = (fieldName: string) => {
    return validationErrors.find((err) => err.field === fieldName)?.message;
  };

  const descriptionError = getFieldError('description');
  const caloriesError = getFieldError('calories');

  const macroErrors: Record<string, string> = {};
  const proteinError = getFieldError('protein');
  const carbsError = getFieldError('carbs');
  const fatsError = getFieldError('fats');
  const fiberError = getFieldError('fiber');

  if (proteinError) macroErrors.protein = proteinError;
  if (carbsError) macroErrors.carbs = carbsError;
  if (fatsError) macroErrors.fats = fatsError;
  if (fiberError) macroErrors.fiber = fiberError;

  return (
    <div className="space-y-4">
      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="manual-description" className="text-sm font-medium">
          Opis posiłku
        </Label>
        <Textarea
          id="manual-description"
          value={description}
          onChange={(e) => onFieldChange('description', e.target.value)}
          placeholder="np. Kurczak z ryżem i warzywami"
          maxLength={VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH}
          rows={3}
          className={`resize-none ${descriptionError ? 'border-destructive' : ''}`}
        />
        <div className="flex items-center justify-between">
          <CharacterCounter
            current={description.length}
            max={VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH}
          />
          {descriptionError && (
            <span className="text-xs text-destructive">{descriptionError}</span>
          )}
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
            value={calories ?? ''}
            onChange={(e) => {
              const value = e.target.value === '' ? null : parseInt(e.target.value, 10);
              onFieldChange('calories', value);
            }}
            placeholder="0"
            className={caloriesError ? 'border-destructive' : ''}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            kcal
          </span>
        </div>
        {caloriesError && <p className="text-xs text-destructive">{caloriesError}</p>}
      </div>

      {/* Macronutrients */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Makroskładniki</Label>
        <MacroInputs
          protein={protein}
          carbs={carbs}
          fats={fats}
          fiber={fiber}
          onChange={onFieldChange}
          errors={macroErrors}
        />
      </div>

      {/* Macro Warning */}
      {macroWarning && (
        <MacroWarning
          calculatedCalories={macroWarning.calculatedCalories}
          providedCalories={macroWarning.providedCalories}
          differencePercent={macroWarning.differencePercent}
          onAutoCalculate={onAutoCalculate}
        />
      )}
    </div>
  );
}
