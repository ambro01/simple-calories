/**
 * GET /api/v1/daily-progress/:date
 *
 * Retrieves daily progress for a specific date for the authenticated user.
 *
 * This endpoint returns progress for a single day. If the user has no meals
 * logged for that date, it returns "zero progress" with their calorie goal
 * (instead of 404 Not Found).
 *
 * Authentication: Required (uses DEFAULT_USER_ID for MVP)
 *
 * @example Request
 * GET /api/v1/daily-progress/2025-01-27
 *
 * @example Response (Success - with meals - 200 OK)
 * {
 *   "date": "2025-01-27",
 *   "user_id": "uuid",
 *   "total_calories": 2150,
 *   "total_protein": 95.5,
 *   "total_carbs": 220.0,
 *   "total_fats": 75.0,
 *   "calorie_goal": 2500,
 *   "percentage": 86.0,
 *   "status": "under"
 * }
 *
 * @example Response (Success - no meals - 200 OK)
 * {
 *   "date": "2025-01-27",
 *   "user_id": "uuid",
 *   "total_calories": 0,
 *   "total_protein": 0,
 *   "total_carbs": 0,
 *   "total_fats": 0,
 *   "calorie_goal": 2500,
 *   "percentage": 0.0,
 *   "status": "under"
 * }
 *
 * @example Response (Validation Error - 400 Bad Request)
 * {
 *   "error": "VALIDATION_ERROR",
 *   "message": "Invalid date parameter",
 *   "details": {
 *     "date": "Date must be in YYYY-MM-DD format"
 *   }
 * }
 */

import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { requireAuth } from "../../../../lib/helpers/auth";
import { GetDailyProgressDateSchema } from "../../../../lib/validation/daily-progress.schemas";
import { DailyProgressService } from "../../../../lib/services/daily-progress.service";
import { logError, formatErrorForLogging } from "../../../../lib/helpers/error-logger";
import type { ErrorResponseDTO, DailyProgressResponseDTO } from "../../../../types";

export const prerender = false;

/**
 * GET handler - Get daily progress for a specific date
 *
 * Flow:
 * 1. Extract and validate date parameter from URL
 * 2. Get authenticated user ID
 * 3. Fetch daily progress from service
 * 4. Return progress (or zero progress if no meals exist)
 *
 * URL Parameters:
 * - date: Date in YYYY-MM-DD format (cannot be in the future)
 *
 * Returns:
 * - 200: Success with daily progress data
 * - 400: Invalid date format or date in future
 * - 401: Unauthorized (not implemented in MVP)
 * - 500: Internal server error
 *
 * Note: This endpoint never returns 404. If no meals exist for the date,
 * it returns 200 with zero progress instead.
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Extract date parameter from URL
    const dateParam = params.date;

    if (!dateParam) {
      const errorResponse: ErrorResponseDTO = {
        error: "VALIDATION_ERROR",
        message: "Date parameter is required",
        details: {
          date: "Date parameter is missing",
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Validate date parameter with Zod
    let validatedDate;
    try {
      validatedDate = GetDailyProgressDateSchema.parse(dateParam);
    } catch (error) {
      if (error instanceof ZodError) {
        // Validation failed - return 400 with details
        const details: Record<string, string> = {};
        error.errors.forEach((err) => {
          const field = err.path.join(".") || "date";
          details[field] = err.message;
        });

        const errorResponse: ErrorResponseDTO = {
          error: "VALIDATION_ERROR",
          message: "Invalid date parameter",
          details,
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw error; // Re-throw if not a Zod error
    }

    // Step 3: Get authenticated user ID from middleware
    const userIdOrResponse = requireAuth(locals);
    if (userIdOrResponse instanceof Response) {
      return userIdOrResponse; // Return 401 if not authenticated
    }
    const userId = userIdOrResponse;

    // Step 4: Fetch daily progress for the specific date
    // Service handles "zero progress" case automatically
    const dailyProgressService = new DailyProgressService(locals.supabase);
    const result = await dailyProgressService.getDailyProgressByDate(userId, validatedDate);

    // Step 5: Return success response
    const response: DailyProgressResponseDTO = result;

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Unexpected error - log to database and return 500
    console.error("Unexpected error in GET /api/v1/daily-progress/:date:", error);

    // Log error to database
    try {
      const errorLogParams = formatErrorForLogging(
        error,
        "daily_progress_date_fetch_failed",
        locals.user?.id,
        {
          endpoint: "GET /api/v1/daily-progress/:date",
          date: params.date,
        }
      );
      await logError(locals.supabase, errorLogParams);
    } catch (logErr) {
      // If logging fails, just log to console
      console.error("Failed to log error to database:", logErr);
    }

    const errorResponse: ErrorResponseDTO = {
      error: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
