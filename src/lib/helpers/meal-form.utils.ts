/**
 * Utility functions for AddMeal form
 *
 * This file contains helper functions for meal form operations,
 * including date/time formatting, macro calculations, and category detection.
 */

import type { MealCategory } from "../../types";
import { MACRO_CALORIES } from "../constants/meal-form.constants";

/**
 * Łączy datę i czas w ISO 8601 timestamp
 * @param date - Data w formacie YYYY-MM-DD
 * @param time - Czas w formacie HH:MM
 * @returns ISO 8601 timestamp (YYYY-MM-DDTHH:MM:00Z)
 */
export function formatDateTime(date: string, time: string): string {
  return `${date}T${time}:00Z`;
}

/**
 * Oblicza kalorie z makroskładników
 * Białko: 4 kcal/g, Węglowodany: 4 kcal/g, Tłuszcze: 9 kcal/g
 *
 * @param protein - Ilość białka w gramach
 * @param carbs - Ilość węglowodanów w gramach
 * @param fats - Ilość tłuszczów w gramach
 * @returns Obliczona liczba kalorii (zaokrąglona do całości)
 */
export function calculateMacroCalories(protein: number | null, carbs: number | null, fats: number | null): number {
  const proteinCal = (protein ?? 0) * MACRO_CALORIES.PROTEIN;
  const carbsCal = (carbs ?? 0) * MACRO_CALORIES.CARBS;
  const fatsCal = (fats ?? 0) * MACRO_CALORIES.FATS;

  return Math.round(proteinCal + carbsCal + fatsCal);
}

/**
 * Auto-wykrywa kategorię posiłku na podstawie czasu
 *
 * @param time - Czas w formacie HH:MM
 * @returns Wykryta kategoria lub null
 */
export function detectCategoryFromTime(time: string): MealCategory | null {
  const [hoursStr] = time.split(":");
  const hours = parseInt(hoursStr, 10);

  if (isNaN(hours)) return null;

  // 06:00-10:00 → breakfast
  if (hours >= 6 && hours < 10) return "breakfast";

  // 12:00-15:00 → lunch
  if (hours >= 12 && hours < 15) return "lunch";

  // 18:00-21:00 → dinner
  if (hours >= 18 && hours < 21) return "dinner";

  // Inne → null (użytkownik może wybrać ręcznie)
  return null;
}

/**
 * Oblicza różnicę procentową między obliczonymi a podanymi kaloriami
 *
 * @param calculated - Obliczone kalorie z makro
 * @param provided - Kalorie podane przez użytkownika
 * @returns Różnica procentowa (0-1, np. 0.05 = 5%)
 */
export function calculateMacroDifference(calculated: number, provided: number): number {
  if (provided === 0) return 0;
  return Math.abs(calculated - provided) / provided;
}

/**
 * Formatuje różnicę procentową do wyświetlenia
 *
 * @param difference - Różnica (0-1)
 * @returns Sformatowany string (np. "5%")
 */
export function formatPercentDifference(difference: number): string {
  return `${Math.round(difference * 100)}%`;
}

/**
 * Pobiera aktualną datę w formacie YYYY-MM-DD (w lokalnej strefie czasowej)
 *
 * @returns Data w formacie YYYY-MM-DD
 */
export function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Pobiera aktualny czas w formacie HH:MM (w lokalnej strefie czasowej)
 *
 * @returns Czas w formacie HH:MM
 */
export function getCurrentTime(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Oblicza różnicę dni między dwiema datami
 *
 * @param date1 - Pierwsza data (YYYY-MM-DD)
 * @param date2 - Druga data (YYYY-MM-DD)
 * @returns Liczba dni różnicy
 */
export function getDaysDifference(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);

  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}
