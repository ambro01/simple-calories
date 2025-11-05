/**
 * Unit tests for macronutrient-validator.ts
 *
 * Testing macronutrient validation logic:
 * - Consistency between provided calories and calculated calories from macros
 * - Input method tracking (ai → ai-edited)
 * - Warning generation for nutritional discrepancies
 */

import { validateMacronutrients, shouldChangeToAIEdited } from "../macronutrient-validator";

describe("validateMacronutrients", () => {
  describe("when macronutrients are not fully provided", () => {
    it("returns empty array when all macros are null", () => {
      const result = validateMacronutrients(500, null, null, null);
      expect(result).toEqual([]);
    });

    it("returns empty array when only protein is provided", () => {
      const result = validateMacronutrients(500, 25, null, null);
      expect(result).toEqual([]);
    });

    it("returns empty array when only two macros are provided", () => {
      const result = validateMacronutrients(500, 25, 50, null);
      expect(result).toEqual([]);
    });

    it("returns empty array when macros are undefined", () => {
      const result = validateMacronutrients(500, undefined, undefined, undefined);
      expect(result).toEqual([]);
    });
  });

  describe("when macronutrients are fully provided and consistent", () => {
    it("returns empty array for perfectly matching values (420 kcal = 18.5g P + 25g C + 28g F)", () => {
      // (18.5 * 4) + (25 * 4) + (28 * 9) = 74 + 100 + 252 = 426 kcal
      // 426 vs 420 = 6 kcal difference = 1.43% (< 5%)
      const result = validateMacronutrients(420, 18.5, 25, 28);
      expect(result).toEqual([]);
    });

    it("returns empty array when difference is exactly 5%", () => {
      // 500 kcal provided
      // Difference of 25 kcal (5%) = calculated 525 or 475
      // (31.25 * 4) + (0 * 4) + (50 * 9) = 125 + 0 + 450 = 575 kcal
      // Let's use: (0 * 4) + (118.75 * 4) + (0 * 9) = 475 kcal
      const result = validateMacronutrients(500, 0, 118.75, 0);
      expect(result).toEqual([]);
    });

    it("returns empty array when difference is less than 5%", () => {
      // 500 kcal provided
      // (25 * 4) + (50 * 4) + (20 * 9) = 100 + 200 + 180 = 480 kcal
      // Difference: 20 kcal = 4% (< 5%)
      const result = validateMacronutrients(500, 25, 50, 20);
      expect(result).toEqual([]);
    });

    it("returns empty array for zero macros (0 kcal calculated)", () => {
      const result = validateMacronutrients(0, 0, 0, 0);
      expect(result).toEqual([]);
    });
  });

  describe("when macronutrients differ significantly from calories", () => {
    it("returns warning when difference exceeds 5% (650 kcal vs 540 calculated)", () => {
      // (45 * 4) + (70 * 4) + (15 * 9) = 180 + 280 + 135 = 595 kcal
      // 650 vs 595 = 55 difference = 8.46% (> 5%)
      const result = validateMacronutrients(650, 45, 70, 15);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        field: "macronutrients",
        message: expect.stringContaining("595 kcal"),
      });
      expect(result[0].message).toContain("650 kcal");
      expect(result[0].message).toContain("more than 5%");
    });

    it("returns warning for large discrepancy (500 kcal vs ~900 calculated)", () => {
      // (100 * 4) + (100 * 4) + (10 * 9) = 400 + 400 + 90 = 890 kcal
      // 500 vs 890 = 390 difference = 78% (> 5%)
      const result = validateMacronutrients(500, 100, 100, 10);

      expect(result).toHaveLength(1);
      expect(result[0].field).toBe("macronutrients");
      expect(result[0].message).toContain("890 kcal");
      expect(result[0].message).toContain("500 kcal");
    });

    it("includes both calculated and provided values in warning message", () => {
      const result = validateMacronutrients(1000, 50, 50, 50);

      expect(result[0].message).toMatch(/\d+ kcal/);
      expect(result[0].message).toContain("1000 kcal");
    });
  });

  describe("edge cases", () => {
    it("handles zero calories without division by zero", () => {
      // 0 provided, but macros suggest 100 kcal
      // Should not crash due to division by zero
      const result = validateMacronutrients(0, 25, 0, 0);

      expect(result).toHaveLength(1);
      expect(result[0].message).toContain("100 kcal");
      expect(result[0].message).toContain("0 kcal");
    });

    it("handles very small calories correctly", () => {
      const result = validateMacronutrients(10, 1, 1, 0);
      // (1 * 4) + (1 * 4) + (0 * 9) = 8 kcal
      // 10 vs 8 = 2 difference = 20% (> 5%)
      expect(result).toHaveLength(1);
    });

    it("handles decimal macros correctly", () => {
      const result = validateMacronutrients(500, 25.5, 50.3, 20.1);
      // (25.5 * 4) + (50.3 * 4) + (20.1 * 9) = 102 + 201.2 + 180.9 = 484.1 kcal
      // 500 vs 484 = 16 difference = 3.2% (< 5%)
      expect(result).toEqual([]);
    });

    it("rounds calculated calories in warning message", () => {
      const result = validateMacronutrients(1000, 50.7, 100.3, 50.5);
      // Should round the calculated value - check that calories are integers (no .5 or .3)
      expect(result[0].message).toMatch(/\d+ kcal/); // Should be integer
      expect(result[0].message).not.toMatch(/\d+\.\d+ kcal/); // No decimals in calories
    });
  });

  describe("formula accuracy", () => {
    it("uses correct formula: 4 kcal/g for protein", () => {
      const result = validateMacronutrients(100, 25, 0, 0);
      // 25g protein * 4 = 100 kcal (exact match)
      expect(result).toEqual([]);
    });

    it("uses correct formula: 4 kcal/g for carbs", () => {
      const result = validateMacronutrients(200, 0, 50, 0);
      // 50g carbs * 4 = 200 kcal (exact match)
      expect(result).toEqual([]);
    });

    it("uses correct formula: 9 kcal/g for fats", () => {
      const result = validateMacronutrients(180, 0, 0, 20);
      // 20g fats * 9 = 180 kcal (exact match)
      expect(result).toEqual([]);
    });

    it("combines all three macros correctly", () => {
      const result = validateMacronutrients(480, 25, 50, 20);
      // (25 * 4) + (50 * 4) + (20 * 9) = 100 + 200 + 180 = 480 kcal
      expect(result).toEqual([]);
    });
  });
});

describe("shouldChangeToAIEdited", () => {
  describe("when input_method is 'ai'", () => {
    it("returns true when calories are changed", () => {
      const currentMeal = { input_method: "ai", calories: 420, description: "Eggs" };
      const updateData = { calories: 450 };

      expect(shouldChangeToAIEdited(currentMeal, updateData)).toBe(true);
    });

    it("returns true when description is changed", () => {
      const currentMeal = { input_method: "ai", calories: 420, description: "Eggs" };
      const updateData = { description: "Scrambled eggs" };

      expect(shouldChangeToAIEdited(currentMeal, updateData)).toBe(true);
    });

    it("returns true when protein is changed", () => {
      const currentMeal = { input_method: "ai", protein: 25 };
      const updateData = { protein: 30 };

      expect(shouldChangeToAIEdited(currentMeal, updateData)).toBe(true);
    });

    it("returns true when carbs are changed", () => {
      const currentMeal = { input_method: "ai", carbs: 50 };
      const updateData = { carbs: 55 };

      expect(shouldChangeToAIEdited(currentMeal, updateData)).toBe(true);
    });

    it("returns true when fats are changed", () => {
      const currentMeal = { input_method: "ai", fats: 20 };
      const updateData = { fats: 25 };

      expect(shouldChangeToAIEdited(currentMeal, updateData)).toBe(true);
    });

    it("returns true when changing from null to a value", () => {
      const currentMeal = { input_method: "ai", protein: null };
      const updateData = { protein: 25 };

      expect(shouldChangeToAIEdited(currentMeal, updateData)).toBe(true);
    });

    it("returns true when changing from a value to null", () => {
      const currentMeal = { input_method: "ai", protein: 25 };
      const updateData = { protein: null };

      expect(shouldChangeToAIEdited(currentMeal, updateData)).toBe(true);
    });
  });

  describe("when input_method is 'ai' but non-nutritional fields change", () => {
    it("returns false when only category is changed", () => {
      const currentMeal = { input_method: "ai", calories: 420 };
      const updateData = { category: "lunch" };

      expect(shouldChangeToAIEdited(currentMeal, updateData)).toBe(false);
    });

    it("returns false when only meal_timestamp is changed", () => {
      const currentMeal = { input_method: "ai", calories: 420 };
      const updateData = { meal_timestamp: "2025-01-27T12:00:00Z" };

      expect(shouldChangeToAIEdited(currentMeal, updateData)).toBe(false);
    });

    it("returns false when both category and meal_timestamp are changed", () => {
      const currentMeal = { input_method: "ai", calories: 420 };
      const updateData = {
        category: "lunch",
        meal_timestamp: "2025-01-27T12:00:00Z"
      };

      expect(shouldChangeToAIEdited(currentMeal, updateData)).toBe(false);
    });
  });

  describe("when input_method is NOT 'ai'", () => {
    it("returns false when input_method is 'manual' and calories change", () => {
      const currentMeal = { input_method: "manual", calories: 420 };
      const updateData = { calories: 450 };

      expect(shouldChangeToAIEdited(currentMeal, updateData)).toBe(false);
    });

    it("returns false when input_method is 'ai-edited' and calories change", () => {
      const currentMeal = { input_method: "ai-edited", calories: 420 };
      const updateData = { calories: 450 };

      expect(shouldChangeToAIEdited(currentMeal, updateData)).toBe(false);
    });

    it("returns false for any other input_method", () => {
      const currentMeal = { input_method: "custom", calories: 420 };
      const updateData = { calories: 450 };

      expect(shouldChangeToAIEdited(currentMeal, updateData)).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("returns false when updateData is empty", () => {
      const currentMeal = { input_method: "ai", calories: 420 };
      const updateData = {};

      expect(shouldChangeToAIEdited(currentMeal, updateData)).toBe(false);
    });

    it("returns false when no nutritional fields change", () => {
      const currentMeal = {
        input_method: "ai",
        calories: 420,
        description: "Eggs",
        protein: 25,
        carbs: 50,
        fats: 20
      };
      const updateData = {
        calories: 420,
        description: "Eggs"
      };

      expect(shouldChangeToAIEdited(currentMeal, updateData)).toBe(false);
    });

    it("returns true when at least one nutritional field changes", () => {
      const currentMeal = {
        input_method: "ai",
        calories: 420,
        description: "Eggs"
      };
      const updateData = {
        calories: 420, // same
        description: "Scrambled eggs", // changed
        category: "breakfast" // non-nutritional
      };

      expect(shouldChangeToAIEdited(currentMeal, updateData)).toBe(true);
    });

    it("returns true when multiple nutritional fields change", () => {
      const currentMeal = {
        input_method: "ai",
        calories: 420,
        protein: 25
      };
      const updateData = {
        calories: 450,
        protein: 30
      };

      expect(shouldChangeToAIEdited(currentMeal, updateData)).toBe(true);
    });
  });

  describe("type coercion and equality", () => {
    it("correctly detects change from null to 0", () => {
      const currentMeal = { input_method: "ai", protein: null };
      const updateData = { protein: 0 };

      expect(shouldChangeToAIEdited(currentMeal, updateData)).toBe(true);
    });

    it("correctly detects no change when both are null", () => {
      const currentMeal = { input_method: "ai", protein: null };
      const updateData = { protein: null };

      expect(shouldChangeToAIEdited(currentMeal, updateData)).toBe(false);
    });

    it("correctly detects no change when values are identical", () => {
      const currentMeal = { input_method: "ai", calories: 420 };
      const updateData = { calories: 420 };

      expect(shouldChangeToAIEdited(currentMeal, updateData)).toBe(false);
    });
  });
});
