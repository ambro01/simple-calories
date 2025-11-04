/**
 * GET /api/v1/calorie-goals/by-date
 *
 * Returns the calorie goal that has effective_from exactly matching the specified date.
 * This is different from /current which uses fallback logic.
 *
 * Used to check if a goal already exists for a specific future date (e.g., tomorrow)
 * before attempting to create or update it in the settings UI.
 *
 * Authentication: Uses DEFAULT_USER_ID for MVP (no JWT yet)
 *
 * @example GET Request
 * GET /api/v1/calorie-goals/by-date?date=2025-01-28
 *
 * @example GET Response (200 OK - goal found)
 * {
 *   "id": "uuid",
 *   "user_id": "uuid",
 *   "daily_goal": 2500,
 *   "effective_from": "2025-01-28",
 *   "created_at": "2025-01-27T10:00:00Z",
 *   "updated_at": "2025-01-27T10:00:00Z",
 *   "is_immutable": false
 * }
 *
 * @example GET Response (404 Not Found - no goal for this date)
 * {
 *   "error": "Not Found",
 *   "message": "No calorie goal found for the specified date"
 * }
 *
 * @example GET Response (400 Bad Request - missing date)
 * {
 *   "error": "Bad Request",
 *   "message": "Date parameter is required"
 * }
 *
 * @example GET Response (400 Bad Request - invalid date)
 * {
 *   "error": "Bad Request",
 *   "message": "Invalid date format. Expected YYYY-MM-DD"
 * }
 */

import type { APIRoute } from "astro";
import { requireAuth } from "../../../../lib/helpers/auth";
import { CalorieGoalService } from "../../../../lib/services/calorie-goal.service";
import { dateQueryParamSchema } from "../../../../lib/validators/calorie-goal.validators";
import { logError } from "../../../../lib/helpers/error-logger";
import type { CalorieGoalResponseDTO, ErrorResponseDTO } from "../../../../types";

export const prerender = false;

/**
 * GET handler - Get calorie goal by exact effective_from date
 *
 * Returns the goal that starts exactly on the given date, or 404 if not found.
 * No fallback logic - either the goal exists for that exact date or it doesn't.
 *
 * Process:
 * 1. Get user ID (currently DEFAULT_USER_ID for MVP)
 * 2. Parse and validate date query parameter (required)
 * 3. Fetch goal by exact effective_from date
 * 4. Return 200 OK with goal, or 404 Not Found
 *
 * Query Parameters:
 * - date: YYYY-MM-DD format (required)
 *
 * RLS Policy: Users can view only their own goals
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // Step 1: Get authenticated user ID from middleware
    const userIdOrResponse = requireAuth(locals);
    if (userIdOrResponse instanceof Response) {
      return userIdOrResponse; // Return 401 if not authenticated
    }
    const userId = userIdOrResponse;

    // Step 2: Parse and validate date parameter
    const dateParam = url.searchParams.get("date");

    // Date is required for this endpoint
    if (!dateParam) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Date parameter is required",
        } as ErrorResponseDTO),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate date format (YYYY-MM-DD regex)
    const dateValidation = dateQueryParamSchema.safeParse(dateParam);
    if (!dateValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid date format. Expected YYYY-MM-DD",
        } as ErrorResponseDTO),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 3: Fetch goal by exact date
    const calorieGoalService = new CalorieGoalService(locals.supabase);
    const goal = await calorieGoalService.getCalorieGoalByDate(userId, dateParam);

    // Step 4: Return goal or 404
    if (!goal) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "No calorie goal found for the specified date",
        } as ErrorResponseDTO),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 5: Check if goal is immutable (has started or is being used)
    const isImmutable = await calorieGoalService.isGoalImmutable(goal.id, userId);

    // Step 6: Return goal with immutability flag
    return new Response(
      JSON.stringify({
        ...goal,
        is_immutable: isImmutable,
      } as CalorieGoalResponseDTO & { is_immutable: boolean }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    // Unexpected error - log to database and return 500
    console.error("Error fetching calorie goal by date:", error);

    await logError(locals.supabase, {
      user_id: locals.user?.id,
      error_type: "calorie_goal_by_date_error",
      error_message: error instanceof Error ? error.message : String(error),
      error_details: error instanceof Error ? { stack: error.stack } : undefined,
      context: {
        endpoint: "GET /api/v1/calorie-goals/by-date",
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
