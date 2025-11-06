/**
 * GET /api/v1/meals/:id
 * PATCH /api/v1/meals/:id
 * DELETE /api/v1/meals/:id
 *
 * Operations on a specific meal by ID.
 *
 * Features:
 * - GET: Retrieve meal details with AI generation info
 * - PATCH: Update meal with automatic input_method change to 'ai-edited'
 * - DELETE: Delete meal permanently
 *
 * Authentication: Required (uses DEFAULT_USER_ID for MVP)
 * Authorization: Row Level Security ensures users can only access their own meals
 */

import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { requireAuth } from "../../../../lib/helpers/auth";
import { UpdateMealSchema } from "../../../../lib/validation/meal.schemas";
import { MealsService } from "../../../../lib/services/meals.service";
import type { ErrorResponseDTO, MealResponseDTO, UpdateMealResponseDTO } from "../../../../types";

/**
 * Validates if a string is a valid UUID format
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * GET handler - Retrieve a specific meal by ID
 *
 * @example Request
 * GET /api/v1/meals/550e8400-e29b-41d4-a716-446655440000
 *
 * @example Response (Success - 200 OK)
 * {
 *   "id": "550e8400-e29b-41d4-a716-446655440000",
 *   "user_id": "uuid",
 *   "description": "Jajka sadzone z chlebem",
 *   "calories": 420,
 *   "protein": 18.5,
 *   "carbs": 25.0,
 *   "fats": 28.0,
 *   "category": "breakfast",
 *   "input_method": "ai",
 *   "meal_timestamp": "2025-01-27T08:30:00Z",
 *   "created_at": "2025-01-27T08:35:00Z",
 *   "updated_at": "2025-01-27T08:35:00Z",
 *   "ai_generation": {
 *     "id": "uuid",
 *     "prompt": "dwa jajka sadzone na maśle i kromka chleba",
 *     "assumptions": "Założono: 2 jajka średniej wielkości...",
 *     "model_used": "gpt-4",
 *     "generation_duration": 1234
 *   }
 * }
 *
 * @example Response (Not Found - 404)
 * {
 *   "error": "NOT_FOUND",
 *   "message": "Meal not found"
 * }
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Parse meal ID from URL params
    const mealId = params.id;

    if (!mealId) {
      const errorResponse: ErrorResponseDTO = {
        error: "VALIDATION_ERROR",
        message: "Meal ID is required",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Validate UUID format
    if (!isValidUUID(mealId)) {
      const errorResponse: ErrorResponseDTO = {
        error: "VALIDATION_ERROR",
        message: "Invalid meal ID format",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 3: Get authenticated user ID from middleware
    const userIdOrResponse = requireAuth(locals);
    if (userIdOrResponse instanceof Response) {
      return userIdOrResponse; // Return 401 if not authenticated
    }
    const userId = userIdOrResponse;

    // Step 4: Fetch meal from service
    const mealsService = new MealsService(locals.supabase);
    const meal = await mealsService.getMealById(mealId, userId);

    // Step 5: Handle not found
    if (!meal) {
      const errorResponse: ErrorResponseDTO = {
        error: "NOT_FOUND",
        message: "Meal not found",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 6: Return meal
    const response: MealResponseDTO = meal;

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Unexpected error
    console.error("Unexpected error in GET /api/v1/meals/:id:", error);

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

/**
 * PATCH handler - Update a specific meal
 *
 * Features:
 * - Partial update (all fields optional)
 * - Automatic input_method change from 'ai' to 'ai-edited' when nutritional values change
 * - Macronutrient consistency warnings
 *
 * @example Request
 * PATCH /api/v1/meals/550e8400-e29b-41d4-a716-446655440000
 * Content-Type: application/json
 *
 * {
 *   "description": "Jajka sadzone z chlebem (updated)",
 *   "calories": 450,
 *   "protein": 20.0
 * }
 *
 * @example Response (Success - 200 OK)
 * {
 *   "id": "550e8400-e29b-41d4-a716-446655440000",
 *   "user_id": "uuid",
 *   "description": "Jajka sadzone z chlebem (updated)",
 *   "calories": 450,
 *   "protein": 20.0,
 *   "carbs": 25.0,
 *   "fats": 28.0,
 *   "category": "breakfast",
 *   "input_method": "ai-edited",
 *   "meal_timestamp": "2025-01-27T08:30:00Z",
 *   "created_at": "2025-01-27T08:35:00Z",
 *   "updated_at": "2025-01-27T10:15:00Z",
 *   "warnings": []
 * }
 *
 * @example Response (Validation Error - 400 Bad Request)
 * {
 *   "error": "VALIDATION_ERROR",
 *   "message": "Invalid update data",
 *   "details": {
 *     "calories": "Calories must be between 1 and 10000"
 *   }
 * }
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // Step 1: Parse meal ID from URL params
    const mealId = params.id;

    if (!mealId) {
      const errorResponse: ErrorResponseDTO = {
        error: "VALIDATION_ERROR",
        message: "Meal ID is required",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Validate UUID format
    if (!isValidUUID(mealId)) {
      const errorResponse: ErrorResponseDTO = {
        error: "VALIDATION_ERROR",
        message: "Invalid meal ID format",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 3: Parse request body
    const body = await request.json();

    // Step 4: Validate request body with Zod
    let validatedData;
    try {
      validatedData = UpdateMealSchema.parse(body);
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
          message: "Invalid update data",
          details,
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw error; // Re-throw if not a Zod error
    }

    // Step 5: Get authenticated user ID from middleware
    const userIdOrResponse = requireAuth(locals);
    if (userIdOrResponse instanceof Response) {
      return userIdOrResponse; // Return 401 if not authenticated
    }
    const userId = userIdOrResponse;

    // Step 6: Fetch current meal (raw data from database)
    const mealsService = new MealsService(locals.supabase);
    const { data: currentMeal, error: fetchError } = await locals.supabase
      .from("meals")
      .select("*")
      .eq("id", mealId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !currentMeal) {
      const errorResponse: ErrorResponseDTO = {
        error: "NOT_FOUND",
        message: "Meal not found",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 7: Update meal via service
    // Service will handle input_method change and macronutrient warnings
    const result = await mealsService.updateMeal(mealId, userId, validatedData, currentMeal);

    if (!result.success || !result.data) {
      const errorResponse: ErrorResponseDTO = {
        error: "INTERNAL_SERVER_ERROR",
        message: result.error || "Failed to update meal",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: result.statusCode || 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 8: Return updated meal with warnings
    const response: UpdateMealResponseDTO = result.data;

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Unexpected error
    console.error("Unexpected error in PATCH /api/v1/meals/:id:", error);

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

/**
 * DELETE handler - Delete a specific meal
 *
 * Performs a hard delete of the meal.
 * Associated ai_generations.meal_id will be set to NULL automatically (CASCADE).
 *
 * @example Request
 * DELETE /api/v1/meals/550e8400-e29b-41d4-a716-446655440000
 *
 * @example Response (Success - 204 No Content)
 * (no body)
 *
 * @example Response (Not Found - 404)
 * {
 *   "error": "NOT_FOUND",
 *   "message": "Meal not found"
 * }
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Parse meal ID from URL params
    const mealId = params.id;

    if (!mealId) {
      const errorResponse: ErrorResponseDTO = {
        error: "VALIDATION_ERROR",
        message: "Meal ID is required",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Validate UUID format
    if (!isValidUUID(mealId)) {
      const errorResponse: ErrorResponseDTO = {
        error: "VALIDATION_ERROR",
        message: "Invalid meal ID format",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 3: Get authenticated user ID from middleware
    const userIdOrResponse = requireAuth(locals);
    if (userIdOrResponse instanceof Response) {
      return userIdOrResponse; // Return 401 if not authenticated
    }
    const userId = userIdOrResponse;

    // Step 4: Delete meal via service
    const mealsService = new MealsService(locals.supabase);
    const deleted = await mealsService.deleteMeal(mealId, userId);

    // Step 5: Handle not found
    if (!deleted) {
      const errorResponse: ErrorResponseDTO = {
        error: "NOT_FOUND",
        message: "Meal not found",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 6: Return 204 No Content
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Unexpected error
    console.error("Unexpected error in DELETE /api/v1/meals/:id:", error);

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
