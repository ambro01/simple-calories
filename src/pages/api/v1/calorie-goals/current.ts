/**
 * GET /api/v1/calorie-goals/current
 *
 * Returns the current calorie goal for the authenticated user on a specific date.
 * Implements smart fallback logic:
 * 1. Returns current goal (effective_from <= target_date) if exists
 * 2. Returns next future goal (effective_from > target_date) if no current goal
 * 3. Returns default goal (2000 kcal) if no goals exist at all
 *
 * This ensures the endpoint always returns a valid goal, even for new users
 * or when a goal is set for tomorrow but queried today.
 *
 * Authentication: Uses DEFAULT_USER_ID for MVP (no JWT yet)
 *
 * @example GET Request (today)
 * GET /api/v1/calorie-goals/current
 *
 * @example GET Request (specific date)
 * GET /api/v1/calorie-goals/current?date=2025-01-27
 *
 * @example GET Response (200 OK - current goal)
 * {
 *   "id": "uuid",
 *   "user_id": "uuid",
 *   "daily_goal": 2500,
 *   "effective_from": "2025-01-20",
 *   "created_at": "2025-01-19T10:00:00Z",
 *   "updated_at": "2025-01-19T10:00:00Z"
 * }
 *
 * @example GET Response (200 OK - default goal)
 * {
 *   "id": "default",
 *   "user_id": "uuid",
 *   "daily_goal": 2000,
 *   "effective_from": "2025-01-27",
 *   "created_at": "2025-01-27T10:00:00Z",
 *   "updated_at": "2025-01-27T10:00:00Z"
 * }
 *
 * @example GET Response (400 Bad Request - invalid date)
 * {
 *   "error": "Bad Request",
 *   "message": "Invalid date format. Expected YYYY-MM-DD"
 * }
 */

import type { APIRoute } from "astro";
import { DEFAULT_USER_ID } from "../../../../db/supabase.client";
import { CalorieGoalService } from "../../../../lib/services/calorie-goal.service";
import { dateQueryParamSchema } from "../../../../lib/validators/calorie-goal.validators";
import { logError } from "../../../../lib/helpers/error-logger";
import type { CalorieGoalResponseDTO, ErrorResponseDTO } from "../../../../types";

export const prerender = false;

/**
 * GET handler - Get current, next, or default calorie goal
 *
 * Smart fallback logic:
 * 1. Try current goal (effective_from <= target_date)
 * 2. Try next future goal (effective_from > target_date)
 * 3. Return default goal (2000 kcal) if no goals exist
 *
 * Process:
 * 1. Get user ID (currently DEFAULT_USER_ID for MVP)
 * 2. Parse and validate date query parameter (default: today)
 * 3. Fetch goal using smart fallback from service
 * 4. Always return 200 OK with a valid goal
 *
 * Query Parameters:
 * - date: YYYY-MM-DD format (optional, default: today)
 *
 * Business Logic Examples:
 * - Goal 1: effective_from = 2025-01-01, daily_goal = 2000
 * - Goal 2: effective_from = 2025-01-30, daily_goal = 2500
 * - GET current?date=2025-01-10 => Goal 1 (2000 kcal - current)
 * - GET current?date=2025-01-27 => Goal 2 (2500 kcal - next future goal)
 * - GET current (no goals) => Default (2000 kcal)
 *
 * RLS Policy: Users can view only their own goals
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // Step 1: Get user ID
    // TODO: Replace with actual JWT authentication
    // const { data: { user }, error: authError } = await locals.supabase.auth.getUser();
    // if (authError || !user) { return 401 }
    const userId = DEFAULT_USER_ID;

    // Step 2: Parse and validate date parameter
    const dateParam = url.searchParams.get("date");

    // Default to today if no date provided
    const targetDate = dateParam || new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Validate date format (YYYY-MM-DD regex)
    const dateValidation = dateQueryParamSchema.safeParse(targetDate);
    if (!dateValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid date format. Expected YYYY-MM-DD",
        } as ErrorResponseDTO),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 3: Fetch goal with smart fallback (current -> next -> default 2000)
    const calorieGoalService = new CalorieGoalService(locals.supabase);
    const goal = await calorieGoalService.getCurrentOrNextCalorieGoal(userId, targetDate);

    // Step 4: Return goal (always succeeds, fallback to default 2000 kcal)
    return new Response(JSON.stringify(goal as CalorieGoalResponseDTO), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Unexpected error - log to database and return 500
    console.error("Error fetching current calorie goal:", error);

    const userId = DEFAULT_USER_ID;
    await logError(locals.supabase, {
      user_id: userId,
      error_type: "current_calorie_goal_error",
      error_message: error instanceof Error ? error.message : String(error),
      error_details: error instanceof Error ? { stack: error.stack } : undefined,
      context: {
        endpoint: "GET /api/v1/calorie-goals/current",
        date_param: url.searchParams.get("date"),
      },
    });

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      } as ErrorResponseDTO),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
