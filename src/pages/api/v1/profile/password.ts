/**
 * PATCH /api/v1/profile/password
 *
 * Password change endpoint for the authenticated user.
 * Allows users to change their password by providing current and new password.
 *
 * Authentication: Requires authenticated user (JWT via middleware)
 *
 * @example PATCH Request
 * PATCH /api/v1/profile/password
 * Content-Type: application/json
 * Authorization: Bearer <token>
 *
 * {
 *   "currentPassword": "OldPass123!",
 *   "newPassword": "NewSecurePass456!"
 * }
 *
 * @example PATCH Response (200 OK)
 * {
 *   "message": "Hasło zostało zmienione pomyślnie"
 * }
 *
 * @example Error Response (401 Unauthorized)
 * {
 *   "error": "Unauthorized",
 *   "message": "Authentication required"
 * }
 *
 * @example Error Response (400 Bad Request - Validation)
 * {
 *   "error": "Bad Request",
 *   "message": "Validation failed",
 *   "details": {
 *     "newPassword": "Nowe hasło musi mieć co najmniej 8 znaków"
 *   }
 * }
 *
 * @example Error Response (400 Bad Request - Wrong Password)
 * {
 *   "error": "Bad Request",
 *   "message": "Aktualne hasło jest nieprawidłowe"
 * }
 */

import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { requireAuth } from "../../../../lib/helpers/auth";
import { ProfileService } from "../../../../lib/services/profile.service";
import { changePasswordSchema } from "../../../../lib/validators/profile.validators";
import { logError } from "../../../../lib/helpers/error-logger";
import type { ErrorResponseDTO } from "../../../../types";

export const prerender = false;

/**
 * PATCH handler - Change authenticated user's password
 *
 * Process:
 * 1. Verify user is authenticated
 * 2. Parse and validate request body (currentPassword, newPassword)
 * 3. Verify current password via ProfileService
 * 4. Update password via Supabase Auth
 * 5. Return success message
 */
export const PATCH: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Get authenticated user ID from middleware
    const userIdOrResponse = requireAuth(locals);
    if (userIdOrResponse instanceof Response) {
      return userIdOrResponse; // Return 401 if not authenticated
    }

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
      validatedData = changePasswordSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        // Format validation errors to match ErrorResponseDTO
        const details: Record<string, string> = {};
        error.errors.forEach((err) => {
          const field = err.path.join(".");
          details[field] = err.message;
        });

        const errorResponse: ErrorResponseDTO = {
          error: "Bad Request",
          message: "Validation failed",
          details,
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Unexpected validation error
      throw error;
    }

    // Step 4: Change password via ProfileService
    const profileService = new ProfileService(locals.supabase);
    try {
      await profileService.changePassword(validatedData.currentPassword, validatedData.newPassword);
    } catch (error) {
      // Handle specific password change errors
      const errorMessage = error instanceof Error ? error.message : "Nie udało się zmienić hasła";

      // If it's a user-facing error (wrong password, etc.), return 400
      if (errorMessage.includes("nieprawidłowe") || errorMessage.includes("incorrect")) {
        return new Response(
          JSON.stringify({
            error: "Bad Request",
            message: errorMessage,
          } as ErrorResponseDTO),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Otherwise, re-throw for generic error handling
      throw error;
    }

    // Step 5: Return success response
    return new Response(
      JSON.stringify({
        message: "Hasło zostało zmienione pomyślnie",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Unexpected error - log to database and return 500
    console.error("Error changing password:", error);

    await logError(locals.supabase, {
      user_id: locals.user?.id,
      error_type: "password_change_error",
      error_message: error instanceof Error ? error.message : String(error),
      error_details: error instanceof Error ? { stack: error.stack } : undefined,
      context: {
        endpoint: "PATCH /api/v1/profile/password",
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
