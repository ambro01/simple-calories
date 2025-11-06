/**
 * Unit tests for meal-form.validation.ts
 *
 * Testing validation functions for meal form:
 * - Prompt validation
 * - Description validation
 * - Calories validation
 * - Macronutrient validation
 * - Date validation
 * - Time validation
 * - AI Generation ID validation
 */

import {
  validatePrompt,
  validateDescription,
  validateCalories,
  validateMacro,
  validateDate,
  validateTime,
  validateAIGenerationId,
} from "../meal-form.validation";
import { VALIDATION_LIMITS } from "../../constants/meal-form.constants";
import * as mealFormUtils from "../../helpers/meal-form.utils";

describe("validatePrompt", () => {
  it("returns error for empty string", () => {
    const result = validatePrompt("");
    expect(result).toEqual({
      field: "prompt",
      message: "Opis posiłku jest wymagany",
    });
  });

  it("returns error for string with only spaces", () => {
    const result = validatePrompt("   ");
    expect(result).toEqual({
      field: "prompt",
      message: "Opis posiłku jest wymagany",
    });
  });

  it("returns null for valid prompt (3+ characters)", () => {
    const result = validatePrompt("Abc");
    expect(result).toBeNull();
  });

  it("returns null for prompt at max length (500 characters)", () => {
    const prompt = "a".repeat(VALIDATION_LIMITS.PROMPT_MAX_LENGTH);
    const result = validatePrompt(prompt);
    expect(result).toBeNull();
  });

  it("returns error for prompt exceeding max length (501 characters)", () => {
    const prompt = "a".repeat(VALIDATION_LIMITS.PROMPT_MAX_LENGTH + 1);
    const result = validatePrompt(prompt);
    expect(result).toEqual({
      field: "prompt",
      message: `Maksymalnie ${VALIDATION_LIMITS.PROMPT_MAX_LENGTH} znaków`,
    });
  });

  it("correctly counts emoji characters", () => {
    // Emoji like 🍕 counts as 2 characters in JS strings (surrogate pair)
    // So we need to use half the limit to stay within bounds
    const prompt = "🍕".repeat(VALIDATION_LIMITS.PROMPT_MAX_LENGTH / 2);
    const result = validatePrompt(prompt);
    expect(result).toBeNull();
  });

  it("trims whitespace before validation", () => {
    const result = validatePrompt("  Valid prompt  ");
    expect(result).toBeNull();
  });
});

describe("validateDescription", () => {
  it("returns error for empty string", () => {
    const result = validateDescription("");
    expect(result).toEqual({
      field: "description",
      message: "Opis posiłku jest wymagany",
    });
  });

  it("returns error for string with only spaces", () => {
    const result = validateDescription("   ");
    expect(result).toEqual({
      field: "description",
      message: "Opis posiłku jest wymagany",
    });
  });

  it("returns null for valid description", () => {
    const result = validateDescription("Valid meal description");
    expect(result).toBeNull();
  });

  it("returns null for description at max length (500 characters)", () => {
    const description = "a".repeat(VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH);
    const result = validateDescription(description);
    expect(result).toBeNull();
  });

  it("returns error for description exceeding max length (501 characters)", () => {
    const description = "a".repeat(VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH + 1);
    const result = validateDescription(description);
    expect(result).toEqual({
      field: "description",
      message: `Maksymalnie ${VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH} znaków`,
    });
  });

  it("correctly handles special characters (🍕)", () => {
    const description = "Pizza 🍕 with cheese";
    const result = validateDescription(description);
    expect(result).toBeNull();
  });

  it("trims whitespace before validation", () => {
    const result = validateDescription("  Valid description  ");
    expect(result).toBeNull();
  });
});

describe("validateCalories", () => {
  it("returns error for null value", () => {
    const result = validateCalories(null);
    expect(result).toEqual({
      field: "calories",
      message: "Kalorie są wymagane",
    });
  });

  it("returns error for undefined value", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = validateCalories(undefined as any);
    expect(result).toEqual({
      field: "calories",
      message: "Kalorie są wymagane",
    });
  });

  it("returns null for minimum valid value (1 kcal)", () => {
    const result = validateCalories(VALIDATION_LIMITS.CALORIES_MIN);
    expect(result).toBeNull();
  });

  it("returns null for mid-range value (500 kcal)", () => {
    const result = validateCalories(500);
    expect(result).toBeNull();
  });

  it("returns null for maximum valid value (10000 kcal)", () => {
    const result = validateCalories(VALIDATION_LIMITS.CALORIES_MAX);
    expect(result).toBeNull();
  });

  it("returns error for 0 calories", () => {
    const result = validateCalories(0);
    expect(result).toEqual({
      field: "calories",
      message: `Minimalna wartość to ${VALIDATION_LIMITS.CALORIES_MIN} kcal`,
    });
  });

  it("returns error for value exceeding maximum (10001 kcal)", () => {
    const result = validateCalories(VALIDATION_LIMITS.CALORIES_MAX + 1);
    expect(result).toEqual({
      field: "calories",
      message: `Maksymalna wartość to ${VALIDATION_LIMITS.CALORIES_MAX} kcal`,
    });
  });

  it("returns error for float value (500.5 kcal)", () => {
    const result = validateCalories(500.5);
    expect(result).toEqual({
      field: "calories",
      message: "Wartość musi być liczbą całkowitą",
    });
  });

  it("returns error for negative value (-5 kcal)", () => {
    const result = validateCalories(-5);
    expect(result).toEqual({
      field: "calories",
      message: `Minimalna wartość to ${VALIDATION_LIMITS.CALORIES_MIN} kcal`,
    });
  });

  it("returns error for NaN", () => {
    const result = validateCalories(NaN);
    expect(result).toEqual({
      field: "calories",
      message: "Wartość musi być liczbą całkowitą",
    });
  });

  it("returns error for Infinity", () => {
    const result = validateCalories(Infinity);
    expect(result).toEqual({
      field: "calories",
      message: "Wartość musi być liczbą całkowitą",
    });
  });
});

describe("validateMacro", () => {
  const fieldName = "protein";

  it("returns null for null value (optional field)", () => {
    const result = validateMacro(null, fieldName);
    expect(result).toBeNull();
  });

  it("returns null for undefined value (optional field)", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = validateMacro(undefined as any, fieldName);
    expect(result).toBeNull();
  });

  it("returns null for minimum valid value (0g)", () => {
    const result = validateMacro(VALIDATION_LIMITS.MACRO_MIN, fieldName);
    expect(result).toBeNull();
  });

  it("returns null for float value (50.5g)", () => {
    const result = validateMacro(50.5, fieldName);
    expect(result).toBeNull();
  });

  it("returns null for maximum valid value (1000g)", () => {
    const result = validateMacro(VALIDATION_LIMITS.MACRO_MAX, fieldName);
    expect(result).toBeNull();
  });

  it("returns error for negative value (-5g)", () => {
    const result = validateMacro(-5, fieldName);
    expect(result).toEqual({
      field: fieldName,
      message: "Wartość nie może być ujemna",
    });
  });

  it("returns error for value exceeding maximum (1001g)", () => {
    const result = validateMacro(VALIDATION_LIMITS.MACRO_MAX + 1, fieldName);
    expect(result).toEqual({
      field: fieldName,
      message: `Maksymalna wartość to ${VALIDATION_LIMITS.MACRO_MAX}g`,
    });
  });

  it("returns error for NaN", () => {
    const result = validateMacro(NaN, fieldName);
    expect(result).toEqual({
      field: fieldName,
      message: "Wartość musi być liczbą",
    });
  });

  it("returns error for string value", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = validateMacro("25" as any, fieldName);
    expect(result).toEqual({
      field: fieldName,
      message: "Wartość musi być liczbą",
    });
  });

  it("validates different field names correctly", () => {
    expect(validateMacro(-1, "protein")?.field).toBe("protein");
    expect(validateMacro(-1, "carbs")?.field).toBe("carbs");
    expect(validateMacro(-1, "fats")?.field).toBe("fats");
    expect(validateMacro(-1, "fiber")?.field).toBe("fiber");
  });
});

describe("validateDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null for today's date", () => {
    vi.setSystemTime(new Date("2025-01-27T12:00:00Z"));
    vi.spyOn(mealFormUtils, "getCurrentDate").mockReturnValue("2025-01-27");

    const result = validateDate("2025-01-27");
    expect(result).toBeNull();
  });

  it("returns null for yesterday", () => {
    vi.setSystemTime(new Date("2025-01-27T12:00:00Z"));
    vi.spyOn(mealFormUtils, "getCurrentDate").mockReturnValue("2025-01-27");

    const result = validateDate("2025-01-26");
    expect(result).toBeNull();
  });

  it("returns null for 7 days ago", () => {
    vi.setSystemTime(new Date("2025-01-27T12:00:00Z"));
    vi.spyOn(mealFormUtils, "getCurrentDate").mockReturnValue("2025-01-27");

    const result = validateDate("2025-01-20");
    expect(result).toBeNull();
  });

  it("returns warning of type 'old' for 8 days ago", () => {
    vi.setSystemTime(new Date("2025-01-27T12:00:00Z"));
    vi.spyOn(mealFormUtils, "getCurrentDate").mockReturnValue("2025-01-27");

    const result = validateDate("2025-01-19");
    expect(result).toEqual({
      type: "old",
      message: "Data jest sprzed 8 dni",
    });
  });

  it("returns error of type 'future' for tomorrow", () => {
    vi.setSystemTime(new Date("2025-01-27T12:00:00Z"));
    vi.spyOn(mealFormUtils, "getCurrentDate").mockReturnValue("2025-01-27");

    const result = validateDate("2025-01-28");
    expect(result).toEqual({
      type: "future",
      message: "Data nie może być w przyszłości",
    });
  });

  it("returns error of type 'future' for next week", () => {
    vi.setSystemTime(new Date("2025-01-27T12:00:00Z"));
    vi.spyOn(mealFormUtils, "getCurrentDate").mockReturnValue("2025-01-27");

    const result = validateDate("2025-02-03");
    expect(result).toEqual({
      type: "future",
      message: "Data nie może być w przyszłości",
    });
  });

  it("returns warning with correct number of days for old dates", () => {
    vi.setSystemTime(new Date("2025-01-27T12:00:00Z"));
    vi.spyOn(mealFormUtils, "getCurrentDate").mockReturnValue("2025-01-27");

    const result = validateDate("2025-01-10");
    expect(result).toEqual({
      type: "old",
      message: "Data jest sprzed 17 dni",
    });
  });
});

describe("validateTime", () => {
  it("returns null for valid time (08:30)", () => {
    const result = validateTime("08:30");
    expect(result).toBeNull();
  });

  it("returns null for midnight (00:00)", () => {
    const result = validateTime("00:00");
    expect(result).toBeNull();
  });

  it("returns null for end of day (23:59)", () => {
    const result = validateTime("23:59");
    expect(result).toBeNull();
  });

  it("returns error for 24:00 (invalid hour)", () => {
    const result = validateTime("24:00");
    expect(result).toEqual({
      field: "time",
      message: "Nieprawidłowy format czasu (wymagany: HH:MM)",
    });
  });

  it("returns error for time without leading zero (8:30)", () => {
    const result = validateTime("8:30");
    expect(result).toEqual({
      field: "time",
      message: "Nieprawidłowy format czasu (wymagany: HH:MM)",
    });
  });

  it("returns error for invalid minutes (08:60)", () => {
    const result = validateTime("08:60");
    expect(result).toEqual({
      field: "time",
      message: "Nieprawidłowy format czasu (wymagany: HH:MM)",
    });
  });

  it("returns error for invalid format (invalid)", () => {
    const result = validateTime("invalid");
    expect(result).toEqual({
      field: "time",
      message: "Nieprawidłowy format czasu (wymagany: HH:MM)",
    });
  });

  it("returns error for empty string", () => {
    const result = validateTime("");
    expect(result).toEqual({
      field: "time",
      message: "Nieprawidłowy format czasu (wymagany: HH:MM)",
    });
  });

  it("returns null for all valid hours (00-23)", () => {
    for (let hour = 0; hour <= 23; hour++) {
      const time = `${hour.toString().padStart(2, "0")}:30`;
      expect(validateTime(time)).toBeNull();
    }
  });

  it("returns null for all valid minutes (00-59)", () => {
    for (let minute = 0; minute <= 59; minute++) {
      const time = `12:${minute.toString().padStart(2, "0")}`;
      expect(validateTime(time)).toBeNull();
    }
  });

  it("returns error for time with seconds (08:30:45)", () => {
    const result = validateTime("08:30:45");
    expect(result).toEqual({
      field: "time",
      message: "Nieprawidłowy format czasu (wymagany: HH:MM)",
    });
  });
});

describe("validateAIGenerationId", () => {
  it("returns error for null value", () => {
    const result = validateAIGenerationId(null);
    expect(result).toEqual({
      field: "aiGenerationId",
      message: "Brak ID generacji AI. Wygeneruj posiłek ponownie.",
    });
  });

  it("returns error for empty string", () => {
    const result = validateAIGenerationId("");
    expect(result).toEqual({
      field: "aiGenerationId",
      message: "Brak ID generacji AI. Wygeneruj posiłek ponownie.",
    });
  });

  it("returns null for valid UUID", () => {
    const result = validateAIGenerationId("550e8400-e29b-41d4-a716-446655440000");
    expect(result).toBeNull();
  });

  it("returns null for any non-empty string", () => {
    const result = validateAIGenerationId("valid-id");
    expect(result).toBeNull();
  });

  it("returns error for undefined", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = validateAIGenerationId(undefined as any);
    expect(result).toEqual({
      field: "aiGenerationId",
      message: "Brak ID generacji AI. Wygeneruj posiłek ponownie.",
    });
  });
});
