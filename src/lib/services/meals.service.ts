/**
 * Meals Service
 *
 * Business logic layer for meal management.
 * Handles CRUD operations for meals with proper validation,
 * AI generation linking, and macronutrient consistency warnings.
 *
 * @module MealsService
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables, Enums } from "../../db/database.types";
import type {
  MealResponseDTO,
  CreateMealRequestDTO,
  UpdateMealRequestDTO,
  CreateMealResponseDTO,
  UpdateMealResponseDTO,
} from "../../types";
import { validateMacronutrients, shouldChangeToAIEdited } from "../helpers/macronutrient-validator";

/**
 * Filter options for getMeals query
 */
export type GetMealsFilters = {
  date?: string; // YYYY-MM-DD - single date filter
  date_from?: string; // YYYY-MM-DD - range start
  date_to?: string; // YYYY-MM-DD - range end
  category?: Enums<"meal_category">; // meal category
  limit: number;
  offset: number;
  sort: "asc" | "desc";
};

/**
 * Result of creating a meal
 */
export type CreateMealResult = {
  success: boolean;
  data?: CreateMealResponseDTO;
  error?: string;
  statusCode?: number;
};

/**
 * Result of updating a meal
 */
export type UpdateMealResult = {
  success: boolean;
  data?: UpdateMealResponseDTO;
  error?: string;
  statusCode?: number;
};

/**
 * Meals Service Class
 *
 * Orchestrates meal operations with proper error handling,
 * AI generation validation, and macronutrient consistency checks.
 */
export class MealsService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Retrieves a list of meals for a user with filtering and pagination
   *
   * Filtering logic:
   * - If `date` is provided, filter by exact date (ignore date_from/date_to)
   * - If `date_from` and/or `date_to` provided, use date range
   * - Category filter is optional and can be combined with date filters
   *
   * @param userId - User ID from authentication
   * @param filters - Filter and pagination options
   * @returns Array of meals with optional AI generation info
   */
  async getMeals(userId: string, filters: GetMealsFilters): Promise<MealResponseDTO[]> {
    try {
      // Build base query
      let query = this.supabase
        .from("meals")
        .select(
          `
          *,
          ai_generation:ai_generations(
            id,
            prompt,
            assumptions,
            model_used,
            generation_duration
          )
        `
        )
        .eq("user_id", userId);

      // Apply date filters
      if (filters.date) {
        // Single date filter - use DATE() to compare only date part
        const startOfDay = `${filters.date}T00:00:00Z`;
        const endOfDay = `${filters.date}T23:59:59.999Z`;
        query = query.gte("meal_timestamp", startOfDay).lte("meal_timestamp", endOfDay);
      } else {
        // Date range filters
        if (filters.date_from) {
          const startOfDay = `${filters.date_from}T00:00:00Z`;
          query = query.gte("meal_timestamp", startOfDay);
        }
        if (filters.date_to) {
          const endOfDay = `${filters.date_to}T23:59:59.999Z`;
          query = query.lte("meal_timestamp", endOfDay);
        }
      }

      // Apply category filter
      if (filters.category) {
        query = query.eq("category", filters.category);
      }

      // Apply sorting
      query = query.order("meal_timestamp", { ascending: filters.sort === "asc" });

      // Apply pagination
      query = query.range(filters.offset, filters.offset + filters.limit - 1);

      const { data, error } = await query;

      if (error) {
        console.error("Failed to fetch meals:", error);
        return [];
      }

      // Format meals with AI generation info
      return (data || []).map((meal) => this.formatMealWithAIGeneration(meal));
    } catch (error) {
      console.error("Unexpected error in getMeals:", error);
      return [];
    }
  }

  /**
   * Counts total meals for a user with filtering
   *
   * Uses same filtering logic as getMeals for consistent pagination
   *
   * @param userId - User ID from authentication
   * @param filters - Filter options (date, category)
   * @returns Total count of meals matching filters
   */
  async countMeals(userId: string, filters: GetMealsFilters): Promise<number> {
    try {
      // Build base query
      let query = this.supabase.from("meals").select("*", { count: "exact", head: true }).eq("user_id", userId);

      // Apply date filters (same logic as getMeals)
      if (filters.date) {
        const startOfDay = `${filters.date}T00:00:00Z`;
        const endOfDay = `${filters.date}T23:59:59.999Z`;
        query = query.gte("meal_timestamp", startOfDay).lte("meal_timestamp", endOfDay);
      } else {
        if (filters.date_from) {
          const startOfDay = `${filters.date_from}T00:00:00Z`;
          query = query.gte("meal_timestamp", startOfDay);
        }
        if (filters.date_to) {
          const endOfDay = `${filters.date_to}T23:59:59.999Z`;
          query = query.lte("meal_timestamp", endOfDay);
        }
      }

      // Apply category filter
      if (filters.category) {
        query = query.eq("category", filters.category);
      }

      const { count, error } = await query;

      if (error) {
        console.error("Failed to count meals:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("Unexpected error in countMeals:", error);
      return 0;
    }
  }

  /**
   * Retrieves a specific meal by ID
   *
   * Validates that the meal belongs to the requesting user.
   * Includes AI generation info if available.
   *
   * @param mealId - Meal UUID
   * @param userId - User ID from authentication
   * @returns Meal record or null if not found/unauthorized
   */
  async getMealById(mealId: string, userId: string): Promise<MealResponseDTO | null> {
    try {
      const { data, error } = await this.supabase
        .from("meals")
        .select(
          `
          *,
          ai_generation:ai_generations(
            id,
            prompt,
            assumptions,
            model_used,
            generation_duration
          )
        `
        )
        .eq("id", mealId)
        .eq("user_id", userId)
        .single();

      if (error || !data) {
        return null;
      }

      return this.formatMealWithAIGeneration(data);
    } catch (error) {
      console.error("Unexpected error in getMealById:", error);
      return null;
    }
  }

  /**
   * Creates a new meal entry
   *
   * Process:
   * 1. Validate AI generation if input_method is 'ai'
   * 2. Calculate macronutrient warnings
   * 3. Insert meal into database
   * 4. Update ai_generations.meal_id if applicable
   * 5. Return meal with warnings
   *
   * @param userId - User ID from authentication
   * @param mealData - Meal creation data (validated by Zod)
   * @returns Created meal with warnings
   */
  async createMeal(userId: string, mealData: CreateMealRequestDTO): Promise<CreateMealResult> {
    try {
      // Step 1: Validate AI generation if needed
      if (mealData.input_method === "ai") {
        const validationResult = await this.validateAIGeneration(mealData.ai_generation_id, userId);

        if (!validationResult.valid) {
          return {
            success: false,
            error: validationResult.error,
            statusCode: validationResult.statusCode || 404,
          };
        }
      }

      // Step 2: Calculate macronutrient warnings
      const warnings = validateMacronutrients(mealData.calories, mealData.protein, mealData.carbs, mealData.fats);

      // Step 3: Insert meal into database
      const { data: meal, error: insertError } = await this.supabase
        .from("meals")
        .insert({
          user_id: userId,
          description: mealData.description,
          calories: mealData.calories,
          protein: mealData.protein ?? null,
          carbs: mealData.carbs ?? null,
          fats: mealData.fats ?? null,
          category: mealData.category ?? null,
          input_method: mealData.input_method,
          meal_timestamp: mealData.meal_timestamp,
        })
        .select()
        .single();

      if (insertError || !meal) {
        console.error("Failed to create meal:", insertError);
        return {
          success: false,
          error: "Failed to create meal",
          statusCode: 500,
        };
      }

      // Step 4: Update ai_generations.meal_id if applicable
      if (mealData.input_method === "ai") {
        await this.supabase.from("ai_generations").update({ meal_id: meal.id }).eq("id", mealData.ai_generation_id);
      }

      // Step 5: Return meal with warnings
      return {
        success: true,
        data: {
          ...meal,
          warnings,
        },
      };
    } catch (error) {
      console.error("Unexpected error in createMeal:", error);
      return {
        success: false,
        error: "An unexpected error occurred",
        statusCode: 500,
      };
    }
  }

  /**
   * Updates an existing meal entry
   *
   * Process:
   * 1. Determine if input_method should change to 'ai-edited'
   * 2. Merge update data with automatic input_method change
   * 3. Calculate macronutrient warnings (using updated values)
   * 4. Update meal in database
   * 5. Fetch updated meal with AI generation info
   * 6. Return meal with warnings
   *
   * @param mealId - Meal UUID
   * @param userId - User ID from authentication
   * @param updateData - Update data (validated by Zod)
   * @param currentMeal - Current meal record (must be fetched first)
   * @returns Updated meal with warnings
   */
  async updateMeal(
    mealId: string,
    userId: string,
    updateData: UpdateMealRequestDTO,
    currentMeal: Tables<"meals">
  ): Promise<UpdateMealResult> {
    try {
      // Step 1: Determine if input_method should change
      const shouldChange = shouldChangeToAIEdited(currentMeal, updateData);

      // Step 2: Merge update data with automatic input_method change
      const finalUpdateData = {
        ...updateData,
        ...(shouldChange && { input_method: "ai-edited" as const }),
      };

      // Step 3: Calculate warnings (using merged values)
      const finalCalories = finalUpdateData.calories ?? currentMeal.calories;
      const finalProtein = finalUpdateData.protein ?? currentMeal.protein;
      const finalCarbs = finalUpdateData.carbs ?? currentMeal.carbs;
      const finalFats = finalUpdateData.fats ?? currentMeal.fats;

      const warnings = validateMacronutrients(finalCalories, finalProtein, finalCarbs, finalFats);

      // Step 4: Update meal in database
      const { error: updateError } = await this.supabase
        .from("meals")
        .update(finalUpdateData)
        .eq("id", mealId)
        .eq("user_id", userId);

      if (updateError) {
        console.error("Failed to update meal:", updateError);
        return {
          success: false,
          error: "Failed to update meal",
          statusCode: 500,
        };
      }

      // Step 5: Fetch updated meal with AI generation info
      const updatedMeal = await this.getMealById(mealId, userId);

      if (!updatedMeal) {
        return {
          success: false,
          error: "Failed to fetch updated meal",
          statusCode: 500,
        };
      }

      // Step 6: Return meal with warnings (cast to include warnings)
      return {
        success: true,
        data: {
          ...(updatedMeal as Tables<"meals">),
          warnings,
        },
      };
    } catch (error) {
      console.error("Unexpected error in updateMeal:", error);
      return {
        success: false,
        error: "An unexpected error occurred",
        statusCode: 500,
      };
    }
  }

  /**
   * Deletes a meal entry
   *
   * Hard delete - meal is permanently removed.
   * CASCADE behavior: ai_generations.meal_id is set to NULL automatically.
   *
   * @param mealId - Meal UUID
   * @param userId - User ID from authentication
   * @returns true if deleted, false if not found or error
   */
  async deleteMeal(mealId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.from("meals").delete().eq("id", mealId).eq("user_id", userId);

      if (error) {
        console.error("Failed to delete meal:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Unexpected error in deleteMeal:", error);
      return false;
    }
  }

  /**
   * Validates that an AI generation exists and is ready to be used
   *
   * Checks:
   * 1. AI generation exists
   * 2. AI generation belongs to the user (authorization)
   * 3. AI generation has status 'completed'
   *
   * @param aiGenerationId - AI generation UUID
   * @param userId - User ID from authentication
   * @returns Validation result with error message if invalid
   */
  private async validateAIGeneration(
    aiGenerationId: string,
    userId: string
  ): Promise<{ valid: boolean; error?: string; statusCode?: number }> {
    try {
      const { data, error } = await this.supabase
        .from("ai_generations")
        .select("id, status, user_id")
        .eq("id", aiGenerationId)
        .eq("user_id", userId)
        .single();

      if (error || !data) {
        return {
          valid: false,
          error: "AI generation not found",
          statusCode: 404,
        };
      }

      if (data.status !== "completed") {
        return {
          valid: false,
          error: "AI generation must be completed before creating a meal",
          statusCode: 400,
        };
      }

      return { valid: true };
    } catch (error) {
      console.error("Unexpected error in validateAIGeneration:", error);
      return {
        valid: false,
        error: "Failed to validate AI generation",
        statusCode: 500,
      };
    }
  }

  /**
   * Formats a meal record with AI generation info
   *
   * Transforms the nested ai_generation array from Supabase
   * into the optional ai_generation object expected by MealResponseDTO.
   *
   * @param meal - Raw meal record from Supabase
   * @returns Formatted meal with optional AI generation info
   */
  private formatMealWithAIGeneration(meal: any): MealResponseDTO {
    // Extract ai_generation array from Supabase response
    const aiGenArray = meal.ai_generation;

    // If ai_generation exists and has data, format it
    const aiGeneration =
      aiGenArray && aiGenArray.length > 0
        ? {
            id: aiGenArray[0].id,
            prompt: aiGenArray[0].prompt,
            assumptions: aiGenArray[0].assumptions,
            model_used: aiGenArray[0].model_used,
            generation_duration: aiGenArray[0].generation_duration,
          }
        : undefined;

    // Remove the raw ai_generation array and add formatted version
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ai_generation: _, ...mealData } = meal;

    return {
      ...mealData,
      ...(aiGeneration && { ai_generation: aiGeneration }),
    };
  }
}
