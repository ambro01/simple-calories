/**
 * Constants for AddMeal form
 *
 * This file contains all constant values used by the AddMeal feature,
 * including icons, loading stages, examples, and validation limits.
 */

import type { MealCategory } from '../../types';
import type { AILoadingStage } from '../../types/add-meal.types';

/**
 * Mapowanie kategorii na ikony
 */
export const CATEGORY_ICONS: Record<MealCategory, string> = {
  breakfast: '🍳',
  lunch: '🍽️',
  dinner: '🍲',
  snack: '🍪',
  other: '🍴',
};

/**
 * Teksty dla etapów ładowania AI
 */
export const AI_LOADING_STAGES: Record<AILoadingStage, string> = {
  0: 'Analizuję opis...',
  1: 'Szacuję kalorie...',
  2: 'Obliczam makroskładniki...',
};

/**
 * Przykłady opisów posiłków
 */
export const MEAL_EXAMPLES = [
  'Kanapka z szynką i serem',
  'Kurczak z ryżem i warzywami',
  'Jogurt naturalny z owocami',
  'Jajecznica z trzech jajek',
];

/**
 * Limity walidacji
 */
export const VALIDATION_LIMITS = {
  PROMPT_MAX_LENGTH: 500,
  DESCRIPTION_MAX_LENGTH: 500,
  CALORIES_MIN: 1,
  CALORIES_MAX: 10000,
  MACRO_MIN: 0,
  MACRO_MAX: 1000,
  MACRO_WARNING_THRESHOLD: 0.05, // 5%
  DATE_WARNING_DAYS: 7,
} as const;

/**
 * Konwersje kalorii dla makroskładników
 * 1g białka = 4 kcal
 * 1g węglowodanów = 4 kcal
 * 1g tłuszczu = 9 kcal
 */
export const MACRO_CALORIES = {
  PROTEIN: 4,
  CARBS: 4,
  FATS: 9,
} as const;
