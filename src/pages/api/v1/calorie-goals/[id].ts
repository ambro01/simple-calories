/**
 * PATCH /api/v1/calorie-goals/:id
 * DELETE /api/v1/calorie-goals/:id
 *
 * Update or delete a specific calorie goal by ID.
 *
 * PATCH allows updating only the daily_goal field; effective_from is immutable.
 * If user wants to change the effective date, they must DELETE and POST new goal.
 *
 * DELETE removes the goal from history. This doesn't affect past calculations
 * as they are based on historical data (immutability principle).
 *
 * Both endpoints use RLS + explicit user_id filtering for IDOR protection.
 *
 * Authentication: Uses DEFAULT_USER_ID for MVP (no JWT yet)
 *
 * @example PATCH Request
 * PATCH /api/v1/calorie-goals/550e8400-e29b-41d4-a716-446655440000
 * Content-Type: application/json
 *
 * { "daily_goal": 2600 }
 *
 * @example PATCH Response (200 OK)
 * {
 *   "id": "550e8400-e29b-41d4-a716-446655440000",
 *   "user_id": "uuid",
 *   "daily_goal": 2600,
 *   "effective_from": "2025-01-28",
 *   "created_at": "2025-01-27T10:00:00Z",
 *   "updated_at": "2025-01-27T12:00:00Z"
 * }
 *
 * @example DELETE Request
 * DELETE /api/v1/calorie-goals/550e8400-e29b-41d4-a716-446655440000
 *
 * @example DELETE Response (204 No Content)
 * (no response body)
 *
 * @example Error Response (404 Not Found)
 * {
 *   "error": "Not Found",
 *   "message": "Calorie goal not found"
 * }
 *
 * @example Error Response (400 Bad Request - invalid UUID)
 * {
 *   "error": "Bad Request",
 *   "message": "Invalid UUID format"
 * }
 */

import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { DEFAULT_USER_ID } from "../../../../db/supabase.client";
import { CalorieGoalService } from "../../../../lib/services/calorie-goal.service";
import { updateCalorieGoalSchema, uuidParamSchema } from "../../../../lib/validators/calorie-goal.validators";
import { logError } from "../../../../lib/helpers/error-logger";
import type { CalorieGoalResponseDTO, ErrorResponseDTO } from "../../../../types";

export const prerender = false;

/**
 * PATCH handler - Update existing calorie goal
 *
 * Only daily_goal can be updated; effective_from is immutable.
 * This maintains data integrity - changing effective_from could break
 * historical calculations.
 *
 * Process:
 * 1. Get user ID (currently DEFAULT_USER_ID for MVP)
 * 2. Validate UUID parameter format
 * 3. Parse and validate request body
 * 4. Update goal via service
 * 5. Return updated goal or 404 if not found
 *
 * Security:
 * - RLS policy ensures users can only update their own goals
 * - Explicit user_id filtering provides additional IDOR protection
 * - UUID validation prevents injection attacks
 *
 * Trigger: update_calorie_goals_updated_at automatically sets updated_at
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // Step 1: Get user ID
    // TODO: Replace with actual JWT authentication
    const userId = DEFAULT_USER_ID;

    // Step 2: Validate UUID parameter
    const idValidation = uuidParamSchema.safeParse(params.id);
    if (!idValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid UUID format",
        } as ErrorResponseDTO),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const goalId = idValidation.data;

    // Step 3: Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid JSON body",
        } as ErrorResponseDTO),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 4: Validate request body
    let validatedData;
    try {
      validatedData = updateCalorieGoalSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        // Format validation errors to match ErrorResponseDTO
        const details: Record<string, string> = {};
        error.errors.forEach((err) => {
          const field = err.path.join(".");
          details[field] = err.message;
        });

        return new Response(
          JSON.stringify({
            error: "Bad Request",
            message: "Validation failed",
            details,
          } as ErrorResponseDTO),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      // Unexpected validation error
      throw error;
    }

    // Step 5: Update calorie goal
    const calorieGoalService = new CalorieGoalService(locals.supabase);
    const updatedGoal = await calorieGoalService.updateCalorieGoal(userId, goalId, validatedData.daily_goal);

    // Step 6: Handle not found case
    if (!updatedGoal) {
      // This happens when:
      // - Goal doesn't exist
      // - Goal exists but belongs to another user (IDOR protection)
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Calorie goal not found",
        } as ErrorResponseDTO),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 7: Return updated goal
    return new Response(JSON.stringify(updatedGoal as CalorieGoalResponseDTO), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Unexpected error - log to database and return 500
    console.error("Error updating calorie goal:", error);

    const userId = DEFAULT_USER_ID;
    await logError(locals.supabase, {
      user_id: userId,
      error_type: "calorie_goal_update_error",
      error_message: error instanceof Error ? error.message : String(error),
      error_details: error instanceof Error ? { stack: error.stack } : undefined,
      context: {
        endpoint: "PATCH /api/v1/calorie-goals/:id",
        goal_id: params.id,
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

/**
 * DELETE handler - Delete calorie goal
 *
 * User can delete any goal from their history, including the current goal.
 * This maintains immutability - deleting a goal doesn't affect past calculations
 * that were based on it.
 *
 * Process:
 * 1. Get user ID (currently DEFAULT_USER_ID for MVP)
 * 2. Validate UUID parameter format
 * 3. Delete goal via service
 * 4. Return 204 No Content or 404 if not found
 *
 * Security:
 * - RLS policy ensures users can only delete their own goals
 * - Explicit user_id filtering provides additional IDOR protection
 * - UUID validation prevents injection attacks
 *
 * Use Cases:
 * - User wants to remove a mistakenly created goal
 * - User wants to "reset" and start fresh
 * - Admin operations (with proper auth, not in MVP)
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Get user ID
    // TODO: Replace with actual JWT authentication
    const userId = DEFAULT_USER_ID;

    // Step 2: Validate UUID parameter
    const idValidation = uuidParamSchema.safeParse(params.id);
    if (!idValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid UUID format",
        } as ErrorResponseDTO),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const goalId = idValidation.data;

    // Step 3: Delete calorie goal
    const calorieGoalService = new CalorieGoalService(locals.supabase);
    const deleted = await calorieGoalService.deleteCalorieGoal(userId, goalId);

    // Step 4: Handle not found case
    if (!deleted) {
      // This happens when:
      // - Goal doesn't exist
      // - Goal exists but belongs to another user (IDOR protection)
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Calorie goal not found",
        } as ErrorResponseDTO),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 5: Return 204 No Content (successful deletion)
    return new Response(null, { status: 204 });
  } catch (error) {
    // Unexpected error - log to database and return 500
    console.error("Error deleting calorie goal:", error);

    const userId = DEFAULT_USER_ID;
    await logError(locals.supabase, {
      user_id: userId,
      error_type: "calorie_goal_delete_error",
      error_message: error instanceof Error ? error.message : String(error),
      error_details: error instanceof Error ? { stack: error.stack } : undefined,
      context: {
        endpoint: "DELETE /api/v1/calorie-goals/:id",
        goal_id: params.id,
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
