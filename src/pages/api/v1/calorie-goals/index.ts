/**
 * GET /api/v1/calorie-goals
 * POST /api/v1/calorie-goals
 *
 * Calorie goals management endpoints for the authenticated user.
 * Allows listing goal history and creating new goals.
 *
 * GET returns paginated list of user's goal history ordered by effective_from DESC.
 * POST creates a new goal effective from tomorrow (CURRENT_DATE + 1).
 *
 * Authentication: Uses DEFAULT_USER_ID for MVP (no JWT yet)
 *
 * @example GET Request
 * GET /api/v1/calorie-goals?limit=20&offset=0
 *
 * @example GET Response (200 OK)
 * {
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "user_id": "uuid",
 *       "daily_goal": 2500,
 *       "effective_from": "2025-01-28",
 *       "created_at": "2025-01-27T10:00:00Z",
 *       "updated_at": "2025-01-27T10:00:00Z"
 *     }
 *   ],
 *   "pagination": {
 *     "total": 5,
 *     "limit": 20,
 *     "offset": 0
 *   }
 * }
 *
 * @example POST Request
 * POST /api/v1/calorie-goals
 * Content-Type: application/json
 *
 * { "daily_goal": 2500 }
 *
 * @example POST Response (201 Created)
 * {
 *   "id": "uuid",
 *   "user_id": "uuid",
 *   "daily_goal": 2500,
 *   "effective_from": "2025-01-28",
 *   "created_at": "2025-01-27T10:00:00Z",
 *   "updated_at": "2025-01-27T10:00:00Z"
 * }
 *
 * @example POST Error Response (409 Conflict)
 * {
 *   "error": "Conflict",
 *   "message": "A calorie goal for this date already exists. Use PATCH to update."
 * }
 */

import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { requireAuth } from "../../../../lib/helpers/auth";
import { CalorieGoalService } from "../../../../lib/services/calorie-goal.service";
import { createCalorieGoalSchema } from "../../../../lib/validators/calorie-goal.validators";
import { logError } from "../../../../lib/helpers/error-logger";
import type { CalorieGoalsListResponseDTO, ErrorResponseDTO, CalorieGoalResponseDTO } from "../../../../types";

export const prerender = false;

/**
 * GET handler - List calorie goals with pagination
 *
 * Returns user's complete goal history ordered by effective_from DESC (newest first).
 * Supports pagination via limit and offset query parameters.
 *
 * Process:
 * 1. Get user ID (currently DEFAULT_USER_ID for MVP)
 * 2. Parse and validate query parameters (limit, offset)
 * 3. Fetch goals and total count in parallel
 * 4. Return paginated response
 *
 * Query Parameters:
 * - limit: number of records (default: 50, max: 100)
 * - offset: number of records to skip (default: 0)
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

    // Step 2: Parse query parameters with validation
    const limitParam = url.searchParams.get("limit");
    const offsetParam = url.searchParams.get("offset");

    // Parse and constrain limit (default: 50, max: 100)
    const limit = Math.min(Math.max(parseInt(limitParam || "50"), 1), 100);

    // Parse and constrain offset (default: 0, min: 0)
    const offset = Math.max(parseInt(offsetParam || "0"), 0);

    // Step 3: Fetch data from service (parallel execution for performance)
    const calorieGoalService = new CalorieGoalService(locals.supabase);
    const [data, total] = await Promise.all([
      calorieGoalService.listCalorieGoals(userId, limit, offset),
      calorieGoalService.countCalorieGoals(userId),
    ]);

    // Step 4: Build paginated response
    const response: CalorieGoalsListResponseDTO = {
      data,
      pagination: {
        total,
        limit,
        offset,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Unexpected error - log to database and return 500
    console.error("Error listing calorie goals:", error);

    await logError(locals.supabase, {
      user_id: locals.user?.id,
      error_type: "calorie_goals_list_error",
      error_message: error instanceof Error ? error.message : String(error),
      error_details: error instanceof Error ? { stack: error.stack } : undefined,
      context: { endpoint: "GET /api/v1/calorie-goals" },
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
 * POST handler - Create new calorie goal
 *
 * Creates a goal that will be effective starting tomorrow (CURRENT_DATE + 1).
 * This prevents users from changing their goal for today after already logging meals.
 *
 * Process:
 * 1. Get user ID (currently DEFAULT_USER_ID for MVP)
 * 2. Parse request body
 * 3. Validate request body (daily_goal: 1-10000)
 * 4. Create calorie goal via service
 * 5. Handle UNIQUE constraint violation (409 Conflict)
 * 6. Return created goal (201 Created)
 *
 * Business Logic:
 * - effective_from is automatically calculated as CURRENT_DATE + 1
 * - Multiple POSTs on same day = 409 Conflict (UNIQUE constraint on user_id, effective_from)
 * - If user wants to change tomorrow's goal, they must PATCH the existing one
 *
 * RLS Policy: Users can insert only their own goals
 * Trigger: update_calorie_goals_updated_at automatically sets updated_at
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Get authenticated user ID from middleware
    const userIdOrResponse = requireAuth(locals);
    if (userIdOrResponse instanceof Response) {
      return userIdOrResponse; // Return 401 if not authenticated
    }
    const userId = userIdOrResponse;

    // Step 2: Parse request body
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

    // Step 3: Validate request body
    let validatedData;
    try {
      validatedData = createCalorieGoalSchema.parse(body);
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

    // Step 4: Create calorie goal
    const calorieGoalService = new CalorieGoalService(locals.supabase);

    try {
      const newGoal = await calorieGoalService.createCalorieGoal(userId, validatedData.daily_goal);

      // Return 201 Created with the new goal
      return new Response(JSON.stringify(newGoal as CalorieGoalResponseDTO), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (createError: any) {
      // Handle UNIQUE constraint violation (PostgreSQL error code 23505)
      // This happens when user tries to create multiple goals for tomorrow
      if (createError.code === "23505") {
        return new Response(
          JSON.stringify({
            error: "Conflict",
            message: "A calorie goal for this date already exists. Use PATCH to update.",
          } as ErrorResponseDTO),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }
      // Re-throw for outer catch block
      throw createError;
    }
  } catch (error) {
    // Unexpected error - log to database and return 500
    console.error("Error creating calorie goal:", error);

    await logError(locals.supabase, {
      user_id: locals.user?.id,
      error_type: "calorie_goal_create_error",
      error_message: error instanceof Error ? error.message : String(error),
      error_details: error instanceof Error ? { stack: error.stack } : undefined,
      context: { endpoint: "POST /api/v1/calorie-goals" },
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
