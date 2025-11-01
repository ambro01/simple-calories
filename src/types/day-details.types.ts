/**
 * Day Details View Type Definitions
 *
 * This file contains all type definitions specific to the Day Details view,
 * including state management, component props, and view models.
 */

import type {
  DailyProgressResponseDTO,
  MealResponseDTO,
  MealCategory,
} from "../types";

/**
 * Stan szczegółów dnia
 */
export interface DayDetailsState {
  date: string; // YYYY-MM-DD
  progress: DailyProgressResponseDTO | null;
  meals: MealResponseDTO[];
  loading: boolean;
  error: string | null;
  deletingMealId: string | null; // ID posiłku obecnie usuwanego
  editingMeal: MealResponseDTO | null; // Posiłek obecnie edytowany
}

/**
 * Stan delete confirmation
 * Może być zarządzany lokalnie w MealCard lub w parent state
 */
export interface DeleteConfirmationState {
  isOpen: boolean;
  mealId: string | null;
  mealDescription: string;
  autoCollapseTimer: NodeJS.Timeout | null;
}

/**
 * Mapowanie kategorii na ikony/kolory
 */
export interface CategoryConfig {
  label: string;
  icon: string;
  color: string;
}

export const CATEGORY_CONFIG: Record<MealCategory, CategoryConfig> = {
  breakfast: {
    label: "Śniadanie",
    icon: "🍳",
    color: "bg-yellow-100 text-yellow-800",
  },
  lunch: {
    label: "Obiad",
    icon: "🍽️",
    color: "bg-blue-100 text-blue-800",
  },
  dinner: {
    label: "Kolacja",
    icon: "🍲",
    color: "bg-purple-100 text-purple-800",
  },
  snack: {
    label: "Przekąska",
    icon: "🍪",
    color: "bg-pink-100 text-pink-800",
  },
  other: {
    label: "Inne",
    icon: "🍴",
    color: "bg-gray-100 text-gray-800",
  },
};
