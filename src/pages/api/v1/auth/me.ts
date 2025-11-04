/**
 * GET /api/v1/auth/me
 *
 * Returns authenticated user's auth information (email, id)
 * This endpoint is used by client-side components to get user email
 * without directly accessing Supabase Auth from the browser.
 *
 * Authentication: Requires authenticated user (JWT via middleware)
 *
 * @example GET Request
 * GET /api/v1/auth/me
 *
 * @example GET Response (200 OK)
 * {
 *   "id": "550e8400-e29b-41d4-a716-446655440000",
 *   "email": "user@example.com"
 * }
 *
 * @example Error Response (401 Unauthorized)
 * {
 *   "error": "Unauthorized",
 *   "message": "Authentication required"
 * }
 */

import type { APIRoute } from "astro";
import { requireAuth } from "../../../../lib/helpers/auth";
import type { ErrorResponseDTO } from "../../../../types";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    // Get authenticated user ID from middleware
    const userIdOrResponse = requireAuth(locals);
    if (userIdOrResponse instanceof Response) {
      return userIdOrResponse; // Return 401 if not authenticated
    }

    // Get user from locals (set by middleware)
    const user = locals.user;

    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "User not found in session",
        } as ErrorResponseDTO),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Return user auth info
    return new Response(
      JSON.stringify({
        id: user.id,
        email: user.email,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching user auth info:", error);

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      } as ErrorResponseDTO),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
