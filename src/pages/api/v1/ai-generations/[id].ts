/**
 * GET /api/v1/ai-generations/:id
 *
 * Retrieves a single AI generation by ID.
 *
 * Returns 404 if not found or doesn't belong to the user.
 *
 * @example Request
 * GET /api/v1/ai-generations/550e8400-e29b-41d4-a716-446655440000
 *
 * @example Response (Success - 200 OK)
 * {
 *   "id": "550e8400-e29b-41d4-a716-446655440000",
 *   "user_id": "uuid",
 *   "prompt": "grilled chicken breast 200g with rice",
 *   "status": "completed",
 *   "generated_calories": 650,
 *   ...
 * }
 *
 * @example Response (Not Found - 404)
 * {
 *   "error": "NOT_FOUND",
 *   "message": "AI generation not found"
 * }
 */

import type { APIRoute } from "astro";
import { DEFAULT_USER_ID } from "../../../../db/supabase.client";
import { AIGenerationService } from "../../../../lib/services/ai-generation.service";
import type { ErrorResponseDTO } from "../../../../types";

/**
 * GET handler - Retrieve single AI generation by ID
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Extract ID from params
    const { id } = params;

    if (!id) {
      const errorResponse: ErrorResponseDTO = {
        error: "BAD_REQUEST",
        message: "AI generation ID is required",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Get user ID
    const userId = DEFAULT_USER_ID;

    // Step 3: Fetch from service
    const aiGenerationService = new AIGenerationService(locals.supabase);
    const data = await aiGenerationService.getAIGeneration(id, userId);

    if (!data) {
      const errorResponse: ErrorResponseDTO = {
        error: "NOT_FOUND",
        message: "AI generation not found",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 4: Return success response
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in GET /api/v1/ai-generations/:id:", error);

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
