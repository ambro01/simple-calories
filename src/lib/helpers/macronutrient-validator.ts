/**
 * Macronutrient Validator Helper
 *
 * Validates macronutrient consistency and generates warnings
 * when calculated calories from macros differ from provided calories.
 *
 * Formula: Calories = 4*protein + 4*carbs + 9*fats
 * Warning threshold: > 5% difference
 *
 * @module MacronutrientValidator
 */

import type { MealWarningDTO } from '../../types';

/**
 * Validates macronutrient consistency
 *
 * Calculates expected calories from protein, carbs, and fats using:
 * - Protein: 4 kcal/g
 * - Carbs: 4 kcal/g
 * - Fats: 9 kcal/g
 *
 * If the calculated calories differ by more than 5% from the provided
 * calories, a warning is added to help users verify their input.
 *
 * @param calories - Total calories provided by user
 * @param protein - Protein in grams (optional)
 * @param carbs - Carbs in grams (optional)
 * @param fats - Fats in grams (optional)
 * @returns Array of warnings (empty if validation passes)
 *
 * @example
 * ```typescript
 * // No warning - values are consistent
 * validateMacronutrients(420, 18.5, 25.0, 28.0);
 * // Returns: []
 *
 * // Warning - calculated calories (540) differ from provided (650)
 * validateMacronutrients(650, 45.0, 70.0, 15.0);
 * // Returns: [{ field: 'macronutrients', message: '...' }]
 * ```
 */
export function validateMacronutrients(
  calories: number,
  protein?: number | null,
  carbs?: number | null,
  fats?: number | null
): MealWarningDTO[] {
  const warnings: MealWarningDTO[] = [];

  // Only validate if all three macros are provided
  if (
    protein !== null &&
    protein !== undefined &&
    carbs !== null &&
    carbs !== undefined &&
    fats !== null &&
    fats !== undefined
  ) {
    // Calculate expected calories from macronutrients
    // Protein: 4 kcal/g, Carbs: 4 kcal/g, Fats: 9 kcal/g
    const calculatedCalories = 4 * protein + 4 * carbs + 9 * fats;

    // Calculate absolute difference and percentage
    const difference = Math.abs(calories - calculatedCalories);
    const percentage = (difference / calories) * 100;

    // Add warning if difference exceeds 5% threshold
    if (percentage > 5) {
      warnings.push({
        field: 'macronutrients',
        message: `The calculated calories from macronutrients (${Math.round(calculatedCalories)} kcal) differs by more than 5% from the provided calories (${calories} kcal). Please verify your input.`,
      });
    }
  }

  return warnings;
}

/**
 * Determines if input_method should be changed from 'ai' to 'ai-edited'
 *
 * When a user edits nutritional values from an AI-generated meal,
 * the input_method should be automatically changed to 'ai-edited'
 * to track the AI's accuracy and user editing patterns.
 *
 * Changes to category alone do NOT trigger this change.
 *
 * @param currentMeal - The existing meal record from database
 * @param updateData - The update data provided by user
 * @returns true if input_method should change to 'ai-edited'
 *
 * @example
 * ```typescript
 * const meal = { input_method: 'ai', calories: 420, description: 'Eggs' };
 *
 * // Returns true - nutritional value changed
 * shouldChangeToAIEdited(meal, { calories: 450 });
 *
 * // Returns false - only category changed
 * shouldChangeToAIEdited(meal, { category: 'lunch' });
 *
 * // Returns false - already edited or manual
 * const manualMeal = { ...meal, input_method: 'manual' };
 * shouldChangeToAIEdited(manualMeal, { calories: 450 });
 * ```
 */
export function shouldChangeToAIEdited(
  currentMeal: {
    input_method: string;
    description?: string;
    calories?: number;
    protein?: number | null;
    carbs?: number | null;
    fats?: number | null;
  },
  updateData: {
    description?: string;
    calories?: number;
    protein?: number | null;
    carbs?: number | null;
    fats?: number | null;
    category?: string | null;
    meal_timestamp?: string;
  }
): boolean {
  // Only change if current method is 'ai'
  if (currentMeal.input_method !== 'ai') {
    return false;
  }

  // Check if any nutritional value changed
  // Note: category and meal_timestamp changes alone do NOT trigger this
  const nutritionalFields = ['description', 'calories', 'protein', 'carbs', 'fats'] as const;

  for (const field of nutritionalFields) {
    if (field in updateData && updateData[field] !== currentMeal[field]) {
      return true;
    }
  }

  return false;
}
