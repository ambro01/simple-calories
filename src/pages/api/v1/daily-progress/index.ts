/**
 * GET /api/v1/daily-progress
 *
 * Retrieves daily progress summary for the authenticated user with pagination and filtering.
 *
 * This endpoint aggregates meal data by date to provide:
 * - Total calories and macronutrients per day
 * - Calorie goal tracking
 * - Progress percentage and status (under/on_track/over)
 *
 * Authentication: Required (uses DEFAULT_USER_ID for MVP)
 *
 * @example Request
 * GET /api/v1/daily-progress?date_from=2025-01-01&date_to=2025-01-31&limit=30&offset=0
 *
 * @example Response (Success - 200 OK)
 * {
 *   "data": [
 *     {
 *       "date": "2025-01-27",
 *       "user_id": "uuid",
 *       "total_calories": 2150,
 *       "total_protein": 95.5,
 *       "total_carbs": 220.0,
 *       "total_fats": 75.0,
 *       "calorie_goal": 2500,
 *       "percentage": 86.0,
 *       "status": "under"
 *     }
 *   ],
 *   "pagination": {
 *     "total": 45,
 *     "limit": 30,
 *     "offset": 0
 *   }
 * }
 *
 * @example Response (Validation Error - 400 Bad Request)
 * {
 *   "error": "VALIDATION_ERROR",
 *   "message": "Invalid query parameters",
 *   "details": {
 *     "date_from": "Date must be in YYYY-MM-DD format",
 *     "limit": "Limit must be at most 100"
 *   }
 * }
 */

import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { GetDailyProgressQuerySchema } from "../../../../lib/validation/daily-progress.schemas";
import { DailyProgressService } from "../../../../lib/services/daily-progress.service";
import { logError, formatErrorForLogging } from "../../../../lib/helpers/error-logger";
import type { ErrorResponseDTO, DailyProgressListResponseDTO } from "../../../../types";

export const prerender = false;

/**
 * GET handler - List daily progress with filtering and pagination
 *
 * Flow:
 * 1. Parse and validate query parameters (date_from, date_to, limit, offset)
 * 2. Get authenticated user ID
 * 3. Fetch daily progress from service (aggregates from daily_progress view)
 * 4. Return paginated list with status calculations
 *
 * Query Parameters:
 * - date_from (optional): Filter start date (YYYY-MM-DD)
 * - date_to (optional): Filter end date (YYYY-MM-DD)
 * - limit (optional, default: 30, max: 100): Number of records
 * - offset (optional, default: 0): Pagination offset
 *
 * Returns:
 * - 200: Success with data and pagination metadata
 * - 400: Invalid query parameters
 * - 401: Unauthorized (not implemented in MVP)
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // Step 1: Parse query parameters
    const rawParams = {
      date_from: url.searchParams.get("date_from") || undefined,
      date_to: url.searchParams.get("date_to") || undefined,
      limit: url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!) : undefined,
      offset: url.searchParams.get("offset") ? parseInt(url.searchParams.get("offset")!) : undefined,
    };

    // Step 2: Validate query parameters with Zod
    let validatedParams;
    try {
      validatedParams = GetDailyProgressQuerySchema.parse(rawParams);
    } catch (error) {
      if (error instanceof ZodError) {
        // Validation failed - return 400 with details
        const details: Record<string, string> = {};
        error.errors.forEach((err) => {
          const field = err.path.join(".");
          details[field] = err.message;
        });

        const errorResponse: ErrorResponseDTO = {
          error: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details,
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw error; // Re-throw if not a Zod error
    }

    // Step 3: Get user ID from authenticated session (set by middleware)
    if (!locals.user) {
      const errorResponse: ErrorResponseDTO = {
        error: "UNAUTHORIZED",
        message: "Authentication required",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = locals.user.id;

    // Step 4: Fetch daily progress from service
    const dailyProgressService = new DailyProgressService(locals.supabase);

    const result = await dailyProgressService.getDailyProgressList({
      userId,
      dateFrom: validatedParams.date_from,
      dateTo: validatedParams.date_to,
      limit: validatedParams.limit,
      offset: validatedParams.offset,
    });

    // Step 5: Return success response
    const response: DailyProgressListResponseDTO = result;

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    // Unexpected error - log to database and return 500
    console.error("Unexpected error in GET /api/v1/daily-progress:", error);

    // Log error to database
    try {
      const errorLogParams = formatErrorForLogging(
        error,
        "daily_progress_list_fetch_failed",
        locals.user?.id, // Use authenticated user ID if available
        {
          endpoint: "GET /api/v1/daily-progress",
          url: url.toString(),
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
