/**
 * POST /api/v1/ai-generations
 *
 * Creates a new AI-powered nutritional estimation for a meal description.
 *
 * Flow:
 * 1. Validate request body (Zod schema)
 * 2. Check rate limit (10 req/min per user)
 * 3. Call AI Generation Service to process
 * 4. Return 201 Created with generation result
 *
 * Authentication: Uses DEFAULT_USER_ID for MVP (no JWT yet)
 * Rate Limiting: 10 requests per minute per user
 *
 * @example Request
 * POST /api/v1/ai-generations
 * Content-Type: application/json
 *
 * {
 *   "prompt": "grilled chicken breast 200g with rice"
 * }
 *
 * @example Response (Success - 201 Created)
 * {
 *   "id": "uuid",
 *   "user_id": "uuid",
 *   "prompt": "grilled chicken breast 200g with rice",
 *   "status": "completed",
 *   "generated_calories": 650,
 *   "generated_protein": 45,
 *   "generated_carbs": 60,
 *   "generated_fats": 18,
 *   "assumptions": "Założenia: 200g grillowanego piersi...",
 *   "error_message": null,
 *   "model_used": "mock-gpt-4",
 *   "generation_duration": 1200,
 *   "meal_id": null,
 *   "created_at": "2024-01-15T10:30:00Z"
 * }
 *
 * @example Response (AI Error - 201 Created but status=failed)
 * {
 *   "id": "uuid",
 *   "status": "failed",
 *   "error_message": "Opis jest zbyt ogólny. Proszę podać konkretne danie...",
 *   "generated_calories": null,
 *   ...
 * }
 *
 * @example Response (Validation Error - 400 Bad Request)
 * {
 *   "error": "VALIDATION_ERROR",
 *   "message": "Invalid request data",
 *   "details": {
 *     "prompt": "Prompt cannot exceed 1000 characters"
 *   }
 * }
 *
 * @example Response (Rate Limit - 429 Too Many Requests)
 * {
 *   "error": "RATE_LIMIT_EXCEEDED",
 *   "message": "Too many requests. Please try again later.",
 *   "retry_after": 45000
 * }
 */

import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { DEFAULT_USER_ID } from "../../../../db/supabase.client";
import { CreateAIGenerationSchema } from "../../../../lib/validation/ai-generation.schemas";
import { AIGenerationService } from "../../../../lib/services/ai-generation.service";
import { aiGenerationRateLimiter } from "../../../../lib/services/rate-limit.service";
import type { ErrorResponseDTO, RateLimitErrorResponseDTO, AIGenerationsListResponseDTO } from "../../../../types";

/**
 * GET handler - List AI generations with pagination
 *
 * Query parameters:
 * - limit: number of records (default: 20, max: 100)
 * - offset: number of records to skip (default: 0)
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // Step 1: Parse query parameters
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0"), 0);

    // Step 2: Get user ID
    const userId = DEFAULT_USER_ID;

    // Step 3: Fetch data from service
    const aiGenerationService = new AIGenerationService(locals.supabase);
    const [data, total] = await Promise.all([
      aiGenerationService.listAIGenerations(userId, limit, offset),
      aiGenerationService.countAIGenerations(userId),
    ]);

    // Step 4: Build paginated response
    const response: AIGenerationsListResponseDTO = {
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
    console.error("Unexpected error in GET /api/v1/ai-generations:", error);

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
 * POST handler - Create new AI generation
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Parse and validate request body
    const body = await request.json();

    let validatedData;
    try {
      validatedData = CreateAIGenerationSchema.parse(body);
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
          message: "Invalid request data",
          details,
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw error; // Re-throw if not a Zod error
    }

    // Step 2: Get user ID (using DEFAULT_USER_ID for MVP)
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

    // Step 3: Check rate limit
    const rateLimitResult = aiGenerationRateLimiter.checkRateLimit(userId);

    if (!rateLimitResult.allowed) {
      const errorResponse: RateLimitErrorResponseDTO = {
        error: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests. Please try again later.",
        retry_after: rateLimitResult.retryAfter || 60000, // Default to 60s if not calculated
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": Math.ceil((rateLimitResult.retryAfter || 60000) / 1000).toString(),
        },
      });
    }

    // Step 4: Increment rate limit counter
    aiGenerationRateLimiter.incrementRateLimit(userId);

    // Step 5: Create AI generation via service
    const aiGenerationService = new AIGenerationService(locals.supabase);
    const result = await aiGenerationService.createAIGeneration(userId, validatedData.prompt);

    if (!result.success || !result.data) {
      // Service-level error (e.g., database failure)
      const errorResponse: ErrorResponseDTO = {
        error: "INTERNAL_SERVER_ERROR",
        message: result.error || "Failed to create AI generation",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 6: Return success response
    // Note: We return 201 even if status='failed', because the record was created
    // The client should check the 'status' field and 'error_message' in the response
    return new Response(JSON.stringify(result.data), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Unexpected error
    console.error("Unexpected error in POST /api/v1/ai-generations:", error);

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
