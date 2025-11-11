/**
 * Unit tests for meal-form.utils.ts
 *
 * Testing pure functions for meal form operations:
 * - Date/time formatting
 * - Macro calculations
 * - Category detection
 * - Percentage calculations
 */

import {
  formatDateTime,
  calculateMacroCalories,
  detectCategoryFromTime,
  calculateMacroDifference,
  formatPercentDifference,
  getCurrentDate,
  getCurrentTime,
  getDaysDifference,
} from "../meal-form.utils";

describe("formatDateTime", () => {
  it("converts local date and time to ISO 8601 UTC format", () => {
    const result = formatDateTime("2025-01-27", "08:30");
    // Result should be a valid ISO 8601 string ending with Z
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it("creates a valid Date object that can be parsed", () => {
    const result = formatDateTime("2025-01-27", "12:00");
    const parsed = new Date(result);
    expect(parsed).toBeInstanceOf(Date);
    expect(parsed.toString()).not.toBe("Invalid Date");
  });

  it("maintains correct date-time relationship after UTC conversion", () => {
    const result = formatDateTime("2025-01-27", "14:00");
    const parsed = new Date(result);

    // Convert back to local time to verify
    const localDate = new Date("2025-01-27T14:00:00");
    expect(parsed.getTime()).toBe(localDate.getTime());
  });
});

describe("calculateMacroCalories", () => {
  it("returns 0 when all values are null", () => {
    expect(calculateMacroCalories(null, null, null)).toBe(0);
  });

  it("calculates calories from protein only (25g = 100 kcal)", () => {
    expect(calculateMacroCalories(25, null, null)).toBe(100);
  });

  it("calculates calories from carbs only (50g = 200 kcal)", () => {
    expect(calculateMacroCalories(null, 50, null)).toBe(200);
  });

  it("calculates calories from fats only (20g = 180 kcal)", () => {
    expect(calculateMacroCalories(null, null, 20)).toBe(180);
  });

  it("calculates calories from all macros (25g protein + 50g carbs + 20g fats = 480 kcal)", () => {
    expect(calculateMacroCalories(25, 50, 20)).toBe(480);
  });

  it("rounds decimal values correctly (25.5g protein + 50.2g carbs + 20.1g fats)", () => {
    // (25.5 * 4) + (50.2 * 4) + (20.1 * 9) = 102 + 200.8 + 180.9 = 483.7 → 484
    expect(calculateMacroCalories(25.5, 50.2, 20.1)).toBe(484);
  });

  it("handles negative values by treating them as their absolute contribution", () => {
    // Edge case: negative values shouldn't occur in practice, but function should handle them
    expect(calculateMacroCalories(-25, null, null)).toBe(-100);
  });

  it("handles very large values (1000g each)", () => {
    // (1000 * 4) + (1000 * 4) + (1000 * 9) = 4000 + 4000 + 9000 = 17000
    expect(calculateMacroCalories(1000, 1000, 1000)).toBe(17000);
  });

  it("treats zero values correctly", () => {
    expect(calculateMacroCalories(0, 0, 0)).toBe(0);
  });

  it("handles mixed null and zero values", () => {
    expect(calculateMacroCalories(0, null, 20)).toBe(180);
  });
});

describe("detectCategoryFromTime", () => {
  // Breakfast: 06:00-09:59
  describe("breakfast detection", () => {
    it('detects "breakfast" at 06:00 (start of range)', () => {
      expect(detectCategoryFromTime("06:00")).toBe("breakfast");
    });

    it('detects "breakfast" at 07:30', () => {
      expect(detectCategoryFromTime("07:30")).toBe("breakfast");
    });

    it('detects "breakfast" at 09:59 (end of range)', () => {
      expect(detectCategoryFromTime("09:59")).toBe("breakfast");
    });

    it("returns null at 10:00 (just after breakfast)", () => {
      expect(detectCategoryFromTime("10:00")).toBeNull();
    });

    it("returns null at 05:59 (just before breakfast)", () => {
      expect(detectCategoryFromTime("05:59")).toBeNull();
    });
  });

  // Lunch: 12:00-14:59
  describe("lunch detection", () => {
    it('detects "lunch" at 12:00 (start of range)', () => {
      expect(detectCategoryFromTime("12:00")).toBe("lunch");
    });

    it('detects "lunch" at 14:30', () => {
      expect(detectCategoryFromTime("14:30")).toBe("lunch");
    });

    it('detects "lunch" at 14:59 (end of range)', () => {
      expect(detectCategoryFromTime("14:59")).toBe("lunch");
    });

    it("returns null at 15:00 (just after lunch)", () => {
      expect(detectCategoryFromTime("15:00")).toBeNull();
    });

    it("returns null at 11:59 (just before lunch)", () => {
      expect(detectCategoryFromTime("11:59")).toBeNull();
    });
  });

  // Dinner: 18:00-20:59
  describe("dinner detection", () => {
    it('detects "dinner" at 18:00 (start of range)', () => {
      expect(detectCategoryFromTime("18:00")).toBe("dinner");
    });

    it('detects "dinner" at 19:30', () => {
      expect(detectCategoryFromTime("19:30")).toBe("dinner");
    });

    it('detects "dinner" at 20:59 (end of range)', () => {
      expect(detectCategoryFromTime("20:59")).toBe("dinner");
    });

    it("returns null at 21:00 (just after dinner)", () => {
      expect(detectCategoryFromTime("21:00")).toBeNull();
    });

    it("returns null at 17:59 (just before dinner)", () => {
      expect(detectCategoryFromTime("17:59")).toBeNull();
    });
  });

  // Edge cases
  describe("edge cases", () => {
    it("returns null for early morning (05:00)", () => {
      expect(detectCategoryFromTime("05:00")).toBeNull();
    });

    it("returns null for late night (23:30)", () => {
      expect(detectCategoryFromTime("23:30")).toBeNull();
    });

    it("returns null for midnight (00:00)", () => {
      expect(detectCategoryFromTime("00:00")).toBeNull();
    });

    it("returns null for invalid time format", () => {
      expect(detectCategoryFromTime("invalid")).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(detectCategoryFromTime("")).toBeNull();
    });

    it("returns null for time with non-numeric characters", () => {
      expect(detectCategoryFromTime("abc:def")).toBeNull();
    });
  });
});

describe("calculateMacroDifference", () => {
  it("returns 0 when values are identical", () => {
    expect(calculateMacroDifference(500, 500)).toBe(0);
  });

  it("calculates 5% difference correctly (500 vs 525)", () => {
    const result = calculateMacroDifference(525, 500);
    expect(result).toBeCloseTo(0.05, 4);
  });

  it("calculates 10% difference correctly (500 vs 550)", () => {
    const result = calculateMacroDifference(550, 500);
    expect(result).toBe(0.1);
  });

  it("returns 0 when provided is 0 (prevents division by zero)", () => {
    expect(calculateMacroDifference(100, 0)).toBe(0);
  });

  it("returns absolute value for negative difference (525 vs 500)", () => {
    const result = calculateMacroDifference(500, 525);
    expect(result).toBeCloseTo(0.047619, 4);
  });

  it("handles very small differences correctly (0.1%)", () => {
    const result = calculateMacroDifference(501, 500);
    expect(result).toBe(0.002);
  });

  it("handles large differences correctly (50%)", () => {
    const result = calculateMacroDifference(750, 500);
    expect(result).toBe(0.5);
  });

  it("calculates difference when calculated is less than provided", () => {
    const result = calculateMacroDifference(450, 500);
    expect(result).toBe(0.1);
  });
});

describe("formatPercentDifference", () => {
  it("formats 0.05 as '5%'", () => {
    expect(formatPercentDifference(0.05)).toBe("5%");
  });

  it("formats 0.15 as '15%'", () => {
    expect(formatPercentDifference(0.15)).toBe("15%");
  });

  it("formats 0.005 as '1%' (rounds up)", () => {
    expect(formatPercentDifference(0.005)).toBe("1%");
  });

  it("formats 0.004 as '0%' (rounds down)", () => {
    expect(formatPercentDifference(0.004)).toBe("0%");
  });

  it("formats 0 as '0%'", () => {
    expect(formatPercentDifference(0)).toBe("0%");
  });

  it("formats 1.0 as '100%'", () => {
    expect(formatPercentDifference(1.0)).toBe("100%");
  });

  it("formats 0.125 as '13%' (rounds to nearest)", () => {
    expect(formatPercentDifference(0.125)).toBe("13%");
  });
});

describe("getCurrentDate", () => {
  beforeEach(() => {
    // Mock Date.now() to return a fixed timestamp
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns date in YYYY-MM-DD format", () => {
    vi.setSystemTime(new Date("2025-01-27T12:00:00Z"));
    const result = getCurrentDate();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("pads single-digit months with leading zero", () => {
    vi.setSystemTime(new Date("2025-01-27T12:00:00Z"));
    const result = getCurrentDate();
    expect(result).toBe("2025-01-27");
  });

  it("pads single-digit days with leading zero", () => {
    vi.setSystemTime(new Date("2025-11-05T12:00:00Z"));
    const result = getCurrentDate();
    expect(result).toBe("2025-11-05");
  });

  it("handles December correctly", () => {
    vi.setSystemTime(new Date("2025-12-31T12:00:00Z"));
    const result = getCurrentDate();
    expect(result).toBe("2025-12-31");
  });
});

describe("getCurrentTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns time in HH:MM format", () => {
    vi.setSystemTime(new Date("2025-01-27T12:30:45Z"));
    const result = getCurrentTime();
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it("pads single-digit hours with leading zero", () => {
    // Create date in local time (not UTC) - 08:30 local
    const localDate = new Date(2025, 0, 27, 8, 30, 0);
    vi.setSystemTime(localDate);
    const result = getCurrentTime();
    expect(result).toBe("08:30");
  });

  it("pads single-digit minutes with leading zero", () => {
    // Create date in local time (not UTC) - 12:05 local
    const localDate = new Date(2025, 0, 27, 12, 5, 0);
    vi.setSystemTime(localDate);
    const result = getCurrentTime();
    expect(result).toBe("12:05");
  });

  it("handles midnight correctly", () => {
    // Create date in local time (not UTC) - 00:00 local
    const localDate = new Date(2025, 0, 27, 0, 0, 0);
    vi.setSystemTime(localDate);
    const result = getCurrentTime();
    expect(result).toBe("00:00");
  });

  it("handles end of day correctly", () => {
    // Create date in local time (not UTC) - 23:59 local
    const localDate = new Date(2025, 0, 27, 23, 59, 0);
    vi.setSystemTime(localDate);
    const result = getCurrentTime();
    expect(result).toBe("23:59");
  });
});

describe("getDaysDifference", () => {
  it("returns 0 for the same date", () => {
    expect(getDaysDifference("2025-01-27", "2025-01-27")).toBe(0);
  });

  it("returns 1 for dates one day apart", () => {
    expect(getDaysDifference("2025-01-27", "2025-01-28")).toBe(1);
  });

  it("returns 7 for dates one week apart", () => {
    expect(getDaysDifference("2025-01-20", "2025-01-27")).toBe(7);
  });

  it("handles dates in different months", () => {
    expect(getDaysDifference("2025-01-31", "2025-02-03")).toBe(3);
  });

  it("returns absolute difference regardless of order (date1 > date2)", () => {
    expect(getDaysDifference("2025-01-28", "2025-01-27")).toBe(1);
  });

  it("returns absolute difference regardless of order (date2 > date1)", () => {
    expect(getDaysDifference("2025-01-27", "2025-01-28")).toBe(1);
  });

  it("handles dates spanning different years", () => {
    expect(getDaysDifference("2024-12-31", "2025-01-02")).toBe(2);
  });

  it("handles leap year correctly", () => {
    // 2024 is a leap year
    expect(getDaysDifference("2024-02-28", "2024-03-01")).toBe(2);
  });

  it("handles large date differences", () => {
    expect(getDaysDifference("2025-01-01", "2025-12-31")).toBe(364);
  });
});
