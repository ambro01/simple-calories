/**
 * Calorie Goal Service
 *
 * Business logic layer for managing user calorie goals.
 * Handles the complete lifecycle of calorie goals including history tracking,
 * current goal calculation, and CRUD operations.
 *
 * Key features:
 * - Historization: Every goal change creates a new record
 * - effective_from is auto-calculated as CURRENT_DATE + 1 for new goals
 * - Current goal lookup: finds the most recent goal <= target date
 * - RLS policies ensure users only access their own goals
 *
 * @module CalorieGoalService
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { CalorieGoalResponseDTO } from "../../types";

/**
 * Calorie Goal Service Class
 *
 * Manages calorie goal CRUD operations with proper error handling,
 * pagination support, and RLS policy enforcement.
 */
export class CalorieGoalService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * List calorie goals for a user with pagination
   *
   * Returns user's complete goal history ordered by effective_from DESC (newest first).
   * Uses RLS policy to ensure users only see their own goals.
   *
   * @param userId - User ID from JWT token (auth.uid())
   * @param limit - Number of records to return (default: 50, max: 100)
   * @param offset - Number of records to skip for pagination (default: 0)
   * @returns Array of calorie goals ordered by effective_from DESC
   */
  async listCalorieGoals(userId: string, limit: number = 50, offset: number = 0): Promise<CalorieGoalResponseDTO[]> {
    const { data, error } = await this.supabase
      .from("calorie_goals")
      .select("*")
      .eq("user_id", userId)
      .order("effective_from", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  /**
   * Count total calorie goals for a user
   *
   * Used for pagination metadata. Returns total number of goals
   * regardless of pagination parameters.
   *
   * @param userId - User ID from JWT token (auth.uid())
   * @returns Total count of calorie goals for the user
   */
  async countCalorieGoals(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("calorie_goals")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Get current calorie goal for a specific date
   *
   * Returns the goal with the latest effective_from <= target_date.
   * This implements goal historization - the most recent goal on or before
   * the target date is the "current" goal for that date.
   *
   * Example:
   * - Goal 1: effective_from = 2025-01-01, daily_goal = 2000
   * - Goal 2: effective_from = 2025-01-15, daily_goal = 2500
   * - getCurrentCalorieGoal('2025-01-10') => Goal 1 (2000 kcal)
   * - getCurrentCalorieGoal('2025-01-20') => Goal 2 (2500 kcal)
   *
   * @param userId - User ID from JWT token (auth.uid())
   * @param targetDate - Date in YYYY-MM-DD format (default: today)
   * @returns Calorie goal or null if no goal exists for that date
   */
  async getCurrentCalorieGoal(
    userId: string,
    targetDate: string // YYYY-MM-DD
  ): Promise<CalorieGoalResponseDTO | null> {
    const { data, error } = await this.supabase
      .from("calorie_goals")
      .select("*")
      .eq("user_id", userId)
      .lte("effective_from", targetDate)
      .order("effective_from", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // PGRST116 = Row not found (not an error, just no goal set yet)
      // This is a normal situation for new users or dates before first goal
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    return data;
  }

  /**
   * Get current or next available calorie goal
   *
   * Smart fallback logic:
   * 1. Try to get goal for target_date (effective_from <= target_date)
   * 2. If not found, get the next future goal (effective_from > target_date)
   * 3. If still not found, return default goal (2000 kcal)
   *
   * This handles the case where a user creates a goal for tomorrow
   * but queries for today - they should see the upcoming goal instead of nothing.
   *
   * @param userId - User ID from JWT token (auth.uid())
   * @param targetDate - Date in YYYY-MM-DD format (default: today)
   * @returns Calorie goal (current, next, or default 2000 kcal)
   */
  async getCurrentOrNextCalorieGoal(
    userId: string,
    targetDate: string // YYYY-MM-DD
  ): Promise<CalorieGoalResponseDTO> {
    // Try to get current goal
    const currentGoal = await this.getCurrentCalorieGoal(userId, targetDate);
    if (currentGoal) {
      return currentGoal;
    }

    // No current goal - try to get next future goal
    const { data: nextGoal, error: nextError } = await this.supabase
      .from("calorie_goals")
      .select("*")
      .eq("user_id", userId)
      .gt("effective_from", targetDate)
      .order("effective_from", { ascending: true })
      .limit(1)
      .single();

    if (!nextError && nextGoal) {
      return nextGoal;
    }

    // No goal found at all - return default goal
    // This is a virtual goal, not stored in database
    return {
      id: "default",
      user_id: userId,
      daily_goal: 2000,
      effective_from: targetDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Create a new calorie goal
   *
   * Creates a goal that will be effective starting tomorrow (CURRENT_DATE + 1).
   * This prevents users from changing their goal for today after already logging meals.
   *
   * IMPORTANT: Multiple calls on the same day will create goals with the same
   * effective_from, which will trigger a UNIQUE constraint violation (error code '23505').
   * The caller should catch this and return 409 Conflict.
   *
   * @param userId - User ID from JWT token (auth.uid())
   * @param dailyGoal - Daily calorie goal (1-10000)
   * @returns Created calorie goal with effective_from set to tomorrow
   * @throws Error with code '23505' if goal already exists for tomorrow
   */
  async createCalorieGoal(userId: string, dailyGoal: number): Promise<CalorieGoalResponseDTO> {
    // Calculate effective_from as tomorrow (CURRENT_DATE + 1)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const effectiveFrom = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD

    const { data, error } = await this.supabase
      .from("calorie_goals")
      .insert({
        user_id: userId,
        daily_goal: dailyGoal,
        effective_from: effectiveFrom,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update an existing calorie goal
   *
   * Only daily_goal can be updated; effective_from is immutable.
   * If a user wants to change the effective date, they must DELETE and POST.
   *
   * Uses RLS policy + explicit user_id filtering for security (IDOR protection).
   * The updated_at field is automatically updated by a database trigger.
   *
   * @param userId - User ID from JWT token (auth.uid())
   * @param goalId - UUID of the calorie goal to update
   * @param dailyGoal - New daily calorie goal (1-10000)
   * @returns Updated calorie goal or null if not found
   */
  async updateCalorieGoal(userId: string, goalId: string, dailyGoal: number): Promise<CalorieGoalResponseDTO | null> {
    const { data, error } = await this.supabase
      .from("calorie_goals")
      .update({ daily_goal: dailyGoal })
      .eq("id", goalId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      // PGRST116 = Row not found (404 equivalent)
      // This happens when goal doesn't exist or doesn't belong to user
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    return data;
  }

  /**
   * Get calorie goal for a specific effective_from date
   *
   * Returns the goal that starts exactly on the given date.
   * This is different from getCurrentCalorieGoal which finds the most recent goal <= date.
   *
   * Used to check if a goal already exists for a specific future date (e.g., tomorrow)
   * before attempting to create or update it.
   *
   * @param userId - User ID from JWT token (auth.uid())
   * @param effectiveFrom - Date in YYYY-MM-DD format
   * @returns Calorie goal or null if no goal exists for that exact date
   */
  async getCalorieGoalByDate(
    userId: string,
    effectiveFrom: string // YYYY-MM-DD
  ): Promise<CalorieGoalResponseDTO | null> {
    const { data, error } = await this.supabase
      .from("calorie_goals")
      .select("*")
      .eq("user_id", userId)
      .eq("effective_from", effectiveFrom)
      .single();

    if (error) {
      // PGRST116 = Row not found (not an error, just no goal for this date)
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    return data;
  }

  /**
   * Check if a calorie goal is immutable (used in any daily progress)
   *
   * A goal is considered immutable if:
   * - Its effective_from date is in the past or today (meaning it could be/is actively used)
   * - There exists at least one daily_progress record where this goal would apply
   *
   * Immutable goals should NOT be modified with PATCH - instead, a new goal
   * should be created with POST for future dates.
   *
   * Business rule: Goals can only be edited if they haven't started yet (effective_from > today)
   *
   * @param goalId - UUID of the calorie goal to check
   * @param userId - User ID from JWT token (auth.uid())
   * @returns true if goal is immutable (has started or is used), false if it can be safely modified
   */
  async isGoalImmutable(
    goalId: string,
    userId: string
  ): Promise<boolean> {
    // Get the goal to check its effective_from date
    const { data: goal, error: goalError } = await this.supabase
      .from("calorie_goals")
      .select("effective_from")
      .eq("id", goalId)
      .eq("user_id", userId)
      .single();

    if (goalError || !goal) {
      // If goal doesn't exist or doesn't belong to user, treat as immutable to be safe
      return true;
    }

    // Check if goal has already started (effective_from <= today)
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const effectiveFrom = goal.effective_from;

    // If goal's effective_from is today or in the past, it's immutable
    if (effectiveFrom <= today) {
      return true;
    }

    // Goal is in the future - it can be safely modified
    return false;
  }

  /**
   * Delete a calorie goal
   *
   * User can delete any goal from their history, including the current goal.
   * Deleting the current goal doesn't affect past calculations (immutability).
   *
   * Uses RLS policy + explicit user_id filtering for security (IDOR protection).
   *
   * @param userId - User ID from JWT token (auth.uid())
   * @param goalId - UUID of the calorie goal to delete
   * @returns true if deleted successfully, false if not found
   */
  async deleteCalorieGoal(userId: string, goalId: string): Promise<boolean> {
    const { error } = await this.supabase.from("calorie_goals").delete().eq("id", goalId).eq("user_id", userId);

    if (error) {
      // PGRST116 = Row not found (404 equivalent)
      if (error.code === "PGRST116") {
        return false;
      }
      throw error;
    }

    return true;
  }
}
