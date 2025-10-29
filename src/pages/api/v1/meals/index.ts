/**
 * GET /api/v1/meals
 * POST /api/v1/meals
 *
 * Operations on meals collection.
 *
 * GET: Retrieves a list of meals for the authenticated user with filtering and pagination.
 * POST: Creates a new meal entry (manual or AI-generated).
 *
 * Authentication: Required (uses DEFAULT_USER_ID for MVP)
 */

import type { APIRoute } from 'astro';
import { ZodError } from 'zod';
import { supabaseClient, DEFAULT_USER_ID } from '../../../../db/supabase.client';
import { GetMealsQuerySchema, CreateMealSchema } from '../../../../lib/validation/meal.schemas';
import { MealsService } from '../../../../lib/services/meals.service';
import type {
  ErrorResponseDTO,
  MealsListResponseDTO,
  CreateMealResponseDTO,
} from '../../../../types';

/**
 * GET handler - List meals with filtering and pagination
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    // Step 1: Parse query parameters
    const rawParams = {
      date: url.searchParams.get('date') || undefined,
      date_from: url.searchParams.get('date_from') || undefined,
      date_to: url.searchParams.get('date_to') || undefined,
      category: url.searchParams.get('category') || undefined,
      limit: url.searchParams.get('limit')
        ? parseInt(url.searchParams.get('limit')!)
        : undefined,
      offset: url.searchParams.get('offset')
        ? parseInt(url.searchParams.get('offset')!)
        : undefined,
      sort: url.searchParams.get('sort') || undefined,
    };

    // Step 2: Validate query parameters with Zod
    let validatedParams;
    try {
      validatedParams = GetMealsQuerySchema.parse(rawParams);
    } catch (error) {
      if (error instanceof ZodError) {
        // Validation failed - return 400 with details
        const details: Record<string, string> = {};
        error.errors.forEach((err) => {
          const field = err.path.join('.');
          details[field] = err.message;
        });

        const errorResponse: ErrorResponseDTO = {
          error: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details,
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw error; // Re-throw if not a Zod error
    }

    // Step 3: Get user ID (using DEFAULT_USER_ID for MVP)
    const userId = DEFAULT_USER_ID;

    // TODO: Replace with JWT authentication in production
    // const session = await getSession(request);
    // if (!session) {
    //   return new Response(JSON.stringify({ error: "UNAUTHORIZED" }), {
    //     status: 401,
    //     headers: { "Content-Type": "application/json" },
    //   });
    // }
    // const userId = session.user.id;

    // Step 4: Fetch meals and count from service
    const mealsService = new MealsService(supabaseClient);

    const filters = {
      date: validatedParams.date,
      date_from: validatedParams.date_from,
      date_to: validatedParams.date_to,
      category: validatedParams.category,
      limit: validatedParams.limit,
      offset: validatedParams.offset,
      sort: validatedParams.sort,
    };

    const [data, total] = await Promise.all([
      mealsService.getMeals(userId, filters),
      mealsService.countMeals(userId, filters),
    ]);

    // Step 5: Build paginated response
    const response: MealsListResponseDTO = {
      data,
      pagination: {
        total,
        limit: validatedParams.limit,
        offset: validatedParams.offset,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Unexpected error
    console.error('Unexpected error in GET /api/v1/meals:', error);

    const errorResponse: ErrorResponseDTO = {
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * POST handler - Create a new meal
 *
 * Creates a new meal entry (manual or AI-generated).
 *
 * Features:
 * - Discriminated union validation based on input_method
 * - AI generation validation (existence, ownership, status)
 * - Macronutrient consistency warnings
 * - meal_timestamp cannot be in the future
 *
 * Flow:
 * 1. Parse and validate request body (Zod discriminated union)
 * 2. Get user ID from authentication
 * 3. Service validates AI generation if needed
 * 4. Service calculates macronutrient warnings
 * 5. Insert meal and update ai_generations.meal_id
 * 6. Return created meal with warnings
 *
 * @example Request (AI-generated meal)
 * POST /api/v1/meals
 * Content-Type: application/json
 *
 * {
 *   "description": "Jajka sadzone z chlebem",
 *   "calories": 420,
 *   "protein": 18.5,
 *   "carbs": 25.0,
 *   "fats": 28.0,
 *   "category": "breakfast",
 *   "input_method": "ai",
 *   "ai_generation_id": "550e8400-e29b-41d4-a716-446655440000",
 *   "meal_timestamp": "2025-01-27T08:30:00Z"
 * }
 *
 * @example Request (Manual meal)
 * POST /api/v1/meals
 * Content-Type: application/json
 *
 * {
 *   "description": "Kurczak z ryżem",
 *   "calories": 650,
 *   "protein": 45.0,
 *   "carbs": 70.0,
 *   "fats": 15.0,
 *   "category": "lunch",
 *   "input_method": "manual",
 *   "meal_timestamp": "2025-01-27T13:00:00Z"
 * }
 *
 * @example Response (Success - 201 Created)
 * {
 *   "id": "uuid",
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
 *   "warnings": []
 * }
 *
 * @example Response (Success with Warning - 201 Created)
 * {
 *   "id": "uuid",
 *   "user_id": "uuid",
 *   "description": "Kurczak z ryżem",
 *   "calories": 650,
 *   "protein": 45.0,
 *   "carbs": 70.0,
 *   "fats": 15.0,
 *   "category": "lunch",
 *   "input_method": "manual",
 *   "meal_timestamp": "2025-01-27T13:00:00Z",
 *   "created_at": "2025-01-27T13:05:00Z",
 *   "updated_at": "2025-01-27T13:05:00Z",
 *   "warnings": [
 *     {
 *       "field": "macronutrients",
 *       "message": "The calculated calories from macronutrients (540 kcal) differs by more than 5% from the provided calories (650 kcal). Please verify your input."
 *     }
 *   ]
 * }
 *
 * @example Response (Validation Error - 400 Bad Request)
 * {
 *   "error": "VALIDATION_ERROR",
 *   "message": "Invalid meal data",
 *   "details": {
 *     "calories": "Calories must be between 1 and 10000",
 *     "meal_timestamp": "Meal timestamp cannot be in the future"
 *   }
 * }
 *
 * @example Response (AI Generation Not Found - 404)
 * {
 *   "error": "NOT_FOUND",
 *   "message": "AI generation not found"
 * }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Step 1: Parse request body
    const body = await request.json();

    // Step 2: Validate request body with Zod (discriminated union)
    let validatedData;
    try {
      validatedData = CreateMealSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        // Validation failed - return 400 with details
        const details: Record<string, string> = {};
        error.errors.forEach((err) => {
          const field = err.path.join('.');
          details[field] = err.message;
        });

        const errorResponse: ErrorResponseDTO = {
          error: 'VALIDATION_ERROR',
          message: 'Invalid meal data',
          details,
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw error; // Re-throw if not a Zod error
    }

    // Step 3: Get user ID (using DEFAULT_USER_ID for MVP)
    const userId = DEFAULT_USER_ID;

    // TODO: Replace with JWT authentication in production
    // const session = await getSession(request);
    // if (!session) {
    //   return new Response(JSON.stringify({ error: "UNAUTHORIZED" }), {
    //     status: 401,
    //     headers: { "Content-Type": "application/json" },
    //   });
    // }
    // const userId = session.user.id;

    // Step 4: Create meal via service
    // Service will:
    // - Validate AI generation if input_method is 'ai'
    // - Calculate macronutrient warnings
    // - Insert meal and update ai_generations.meal_id
    const mealsService = new MealsService(supabaseClient);
    const result = await mealsService.createMeal(userId, validatedData);

    if (!result.success || !result.data) {
      // Service-level error (AI generation validation, database failure, etc.)
      const errorResponse: ErrorResponseDTO = {
        error:
          result.statusCode === 404
            ? 'NOT_FOUND'
            : result.statusCode === 400
              ? 'VALIDATION_ERROR'
              : 'INTERNAL_SERVER_ERROR',
        message: result.error || 'Failed to create meal',
      };

      return new Response(JSON.stringify(errorResponse), {
        status: result.statusCode || 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Step 5: Return created meal with warnings
    // Note: We return 201 Created with warnings array
    // Warnings are informational, not errors
    const response: CreateMealResponseDTO = result.data;

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Unexpected error
    console.error('Unexpected error in POST /api/v1/meals:', error);

    const errorResponse: ErrorResponseDTO = {
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
