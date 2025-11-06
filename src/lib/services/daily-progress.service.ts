/**
 * Daily Progress Service
 *
 * Business logic layer for managing user daily progress tracking.
 * Aggregates meal data to provide daily summaries including calories,
 * macronutrients, goal tracking, and status calculation.
 *
 * Key features:
 * - Retrieves data from daily_progress view (database aggregation)
 * - Calculates progress status (under/on_track/over)
 * - Handles "zero progress" case when no meals exist for a date
 * - RLS policies ensure users only access their own progress
 *
 * @module DailyProgressService
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { DailyProgressResponseDTO, DailyProgressListResponseDTO, DailyProgressStatus } from "../../types";

/**
 * Query parameters for listing daily progress records
 */
type GetDailyProgressListParams = {
  userId: string;
  dateFrom?: string;
  dateTo?: string;
  limit: number;
  offset: number;
};

/**
 * Raw result from daily_progress view (database row)
 * Note: totals can be null when no meals exist for that date
 */
type DailyProgressViewRow = {
  date: string;
  user_id: string;
  total_calories: number | null;
  total_protein: number | null;
  total_carbs: number | null;
  total_fats: number | null;
  calorie_goal: number;
  percentage: number | null;
};

/**
 * Daily Progress Service Class
 *
 * Manages daily progress CRUD operations with proper error handling,
 * pagination support, and RLS policy enforcement.
 */
export class DailyProgressService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Calculate progress status based on total calories vs calorie goal
   *
   * Status calculation rules:
   * - under: total_calories < calorie_goal - 100
   * - on_track: calorie_goal - 100 <= total_calories <= calorie_goal + 100
   * - over: total_calories > calorie_goal + 100
   *
   * @param totalCalories - Total calories consumed
   * @param calorieGoal - Target calorie goal
   * @returns Progress status
   *
   * @example
   * calculateStatus(1800, 2000) // "under"
   * calculateStatus(2000, 2000) // "on_track"
   * calculateStatus(2250, 2000) // "over"
   */
  private calculateStatus(totalCalories: number, calorieGoal: number): DailyProgressStatus {
    if (totalCalories < calorieGoal - 100) {
      return "under";
    }
    if (totalCalories > calorieGoal + 100) {
      return "over";
    }
    return "on_track";
  }

  /**
   * Transform raw view row to DTO with computed fields
   *
   * Converts nullable aggregates to 0 and adds computed status field.
   *
   * @param row - Raw row from daily_progress view
   * @returns Formatted DTO ready for API response
   */
  private transformViewRowToDTO(row: DailyProgressViewRow): DailyProgressResponseDTO {
    const totalCalories = row.total_calories ?? 0;
    const totalProtein = row.total_protein ?? 0;
    const totalCarbs = row.total_carbs ?? 0;
    const totalFats = row.total_fats ?? 0;
    const percentage = row.percentage ?? 0;
    const status = this.calculateStatus(totalCalories, row.calorie_goal);

    return {
      date: row.date,
      user_id: row.user_id,
      total_calories: totalCalories,
      total_protein: totalProtein,
      total_carbs: totalCarbs,
      total_fats: totalFats,
      calorie_goal: row.calorie_goal,
      percentage,
      status,
    };
  }

  /**
   * List daily progress records for a user with pagination and filtering
   *
   * Returns user's daily progress history ordered by date DESC (newest first).
   * Uses RLS policy to ensure users only see their own progress.
   *
   * Note: Uses COUNT(*) OVER() window function for efficient pagination.
   *
   * @param params - Query parameters including filters and pagination
   * @returns List of daily progress records with pagination metadata
   */
  async getDailyProgressList(params: GetDailyProgressListParams): Promise<DailyProgressListResponseDTO> {
    const { userId, dateFrom, dateTo, limit, offset } = params;

    // Build query with filters
    let query = this.supabase
      .from("daily_progress")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("date", { ascending: false });

    // Apply date range filters if provided
    if (dateFrom) {
      query = query.gte("date", dateFrom);
    }
    if (dateTo) {
      query = query.lte("date", dateTo);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Transform results and add status
    const transformedData = (data || []).map((row) => this.transformViewRowToDTO(row as DailyProgressViewRow));

    return {
      data: transformedData,
      pagination: {
        total: count ?? 0,
        limit,
        offset,
      },
    };
  }

  /**
   * Get daily progress for a specific date
   *
   * Returns progress for a specific date. If no meals exist for that date,
   * returns "zero progress" with the user's calorie goal.
   *
   * This ensures the API always returns 200 with data, never 404 for missing dates.
   *
   * @param userId - User ID from JWT token (auth.uid())
   * @param date - Date in YYYY-MM-DD format
   * @returns Daily progress for the specified date
   */
  async getDailyProgressByDate(userId: string, date: string): Promise<DailyProgressResponseDTO> {
    const { data, error } = await this.supabase
      .from("daily_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .single();

    if (error) {
      // PGRST116 = Row not found - this means no meals for this date
      if (error.code === "PGRST116") {
        return await this.getZeroProgress(userId, date);
      }
      throw error;
    }

    return this.transformViewRowToDTO(data as DailyProgressViewRow);
  }

  /**
   * Get "zero progress" for a date with no meals
   *
   * Creates a progress object with 0 totals but includes the user's calorie goal
   * for that date. This is used when a user has no meals logged for a specific day.
   *
   * @param userId - User ID from JWT token (auth.uid())
   * @param date - Date in YYYY-MM-DD format
   * @returns Zero progress object with user's calorie goal
   */
  private async getZeroProgress(userId: string, date: string): Promise<DailyProgressResponseDTO> {
    // Call the database function to get calorie goal for this date
    const { data, error } = await this.supabase.rpc("get_current_calorie_goal", {
      user_uuid: userId,
      target_date: date,
    });

    if (error) throw error;

    // Default to 2000 if no goal is set (function returns null)
    const calorieGoal = data ?? 2000;

    return {
      date,
      user_id: userId,
      total_calories: 0,
      total_protein: 0,
      total_carbs: 0,
      total_fats: 0,
      calorie_goal: calorieGoal,
      percentage: 0,
      status: "under",
    };
  }
}
