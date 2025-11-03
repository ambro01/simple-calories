/**
 * Validation functions for AddMeal form
 *
 * This file contains all validation logic for the meal form,
 * including field validation and date validation.
 */

import type { FormValidationError, DateValidationWarning } from "../../types/add-meal.types";
import { VALIDATION_LIMITS } from "../constants/meal-form.constants";
import { getCurrentDate, getDaysDifference } from "../helpers/meal-form.utils";

/**
 * Waliduje prompt AI
 *
 * @param prompt - Tekst promptu
 * @returns Błąd walidacji lub null jeśli poprawny
 */
export function validatePrompt(prompt: string): FormValidationError | null {
  const trimmed = prompt.trim();

  if (!trimmed) {
    return {
      field: "prompt",
      message: "Opis posiłku jest wymagany",
    };
  }

  if (trimmed.length > VALIDATION_LIMITS.PROMPT_MAX_LENGTH) {
    return {
      field: "prompt",
      message: `Maksymalnie ${VALIDATION_LIMITS.PROMPT_MAX_LENGTH} znaków`,
    };
  }

  return null;
}

/**
 * Waliduje opis posiłku (tryb manual)
 *
 * @param description - Tekst opisu
 * @returns Błąd walidacji lub null jeśli poprawny
 */
export function validateDescription(description: string): FormValidationError | null {
  const trimmed = description.trim();

  if (!trimmed) {
    return {
      field: "description",
      message: "Opis posiłku jest wymagany",
    };
  }

  if (trimmed.length > VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH) {
    return {
      field: "description",
      message: `Maksymalnie ${VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH} znaków`,
    };
  }

  return null;
}

/**
 * Waliduje kalorie
 *
 * @param calories - Wartość kalorii
 * @returns Błąd walidacji lub null jeśli poprawny
 */
export function validateCalories(calories: number | null): FormValidationError | null {
  if (calories === null || calories === undefined) {
    return {
      field: "calories",
      message: "Kalorie są wymagane",
    };
  }

  if (!Number.isInteger(calories)) {
    return {
      field: "calories",
      message: "Wartość musi być liczbą całkowitą",
    };
  }

  if (calories < VALIDATION_LIMITS.CALORIES_MIN) {
    return {
      field: "calories",
      message: `Minimalna wartość to ${VALIDATION_LIMITS.CALORIES_MIN} kcal`,
    };
  }

  if (calories > VALIDATION_LIMITS.CALORIES_MAX) {
    return {
      field: "calories",
      message: `Maksymalna wartość to ${VALIDATION_LIMITS.CALORIES_MAX} kcal`,
    };
  }

  return null;
}

/**
 * Waliduje makroskładnik
 *
 * @param value - Wartość makroskładnika
 * @param field - Nazwa pola (protein, carbs, fats, fiber)
 * @returns Błąd walidacji lub null jeśli poprawny
 */
export function validateMacro(value: number | null, field: string): FormValidationError | null {
  // Makro są opcjonalne
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "number" || isNaN(value)) {
    return {
      field,
      message: "Wartość musi być liczbą",
    };
  }

  if (value < VALIDATION_LIMITS.MACRO_MIN) {
    return {
      field,
      message: "Wartość nie może być ujemna",
    };
  }

  if (value > VALIDATION_LIMITS.MACRO_MAX) {
    return {
      field,
      message: `Maksymalna wartość to ${VALIDATION_LIMITS.MACRO_MAX}g`,
    };
  }

  return null;
}

/**
 * Waliduje datę posiłku
 *
 * @param date - Data w formacie YYYY-MM-DD
 * @returns Ostrzeżenie lub null jeśli poprawna
 */
export function validateDate(date: string): DateValidationWarning | null {
  const today = getCurrentDate();
  const selectedDate = new Date(date);
  const todayDate = new Date(today);

  selectedDate.setHours(0, 0, 0, 0);
  todayDate.setHours(0, 0, 0, 0);

  // Przyszłość - error (blokuje submit)
  if (selectedDate > todayDate) {
    return {
      type: "future",
      message: "Data nie może być w przyszłości",
    };
  }

  // >7 dni wstecz - warning (nie blokuje)
  const diffDays = getDaysDifference(date, today);
  if (diffDays > VALIDATION_LIMITS.DATE_WARNING_DAYS) {
    return {
      type: "old",
      message: `Data jest sprzed ${diffDays} dni`,
    };
  }

  return null;
}

/**
 * Waliduje format czasu HH:MM
 *
 * @param time - Czas w formacie HH:MM
 * @returns Błąd walidacji lub null jeśli poprawny
 */
export function validateTime(time: string): FormValidationError | null {
  const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;

  if (!timeRegex.test(time)) {
    return {
      field: "time",
      message: "Nieprawidłowy format czasu (wymagany: HH:MM)",
    };
  }

  return null;
}

/**
 * Waliduje ID generacji AI
 *
 * @param aiGenerationId - ID generacji AI
 * @returns Błąd walidacji lub null jeśli poprawny
 */
export function validateAIGenerationId(aiGenerationId: string | null): FormValidationError | null {
  if (!aiGenerationId) {
    return {
      field: "aiGenerationId",
      message: "Brak ID generacji AI. Wygeneruj posiłek ponownie.",
    };
  }

  return null;
}
