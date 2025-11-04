/**
 * POST /api/v1/auth/logout
 *
 * Logs out the authenticated user by clearing their session.
 * Uses Supabase SSR to properly clear auth cookies.
 *
 * Authentication: Public endpoint (but requires valid session to actually logout)
 *
 * @example POST Request
 * POST /api/v1/auth/logout
 *
 * @example POST Response (200 OK)
 * {
 *   "success": true
 * }
 *
 * @example Error Response (500 Internal Server Error)
 * {
 *   "error": "Internal Server Error",
 *   "message": "Failed to logout"
 * }
 */

import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client";
import type { ErrorResponseDTO } from "@/types";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Create Supabase server instance with proper cookie handling
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Sign out the user (clears session and cookies)
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Failed to logout",
        } as ErrorResponseDTO),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected logout error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      } as ErrorResponseDTO),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
