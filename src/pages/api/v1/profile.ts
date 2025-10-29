/**
 * GET /api/v1/profile
 * PATCH /api/v1/profile
 *
 * Profile management endpoints for the authenticated user.
 * Allows retrieving and updating the user's profile.
 *
 * The profile record is automatically created on user signup via the
 * handle_new_user() trigger and serves as a bridge between Supabase Auth
 * and application logic.
 *
 * Authentication: Uses DEFAULT_USER_ID for MVP (no JWT yet)
 *
 * @example GET Request
 * GET /api/v1/profile
 * Authorization: Bearer <token>
 *
 * @example GET Response (200 OK)
 * {
 *   "id": "550e8400-e29b-41d4-a716-446655440000",
 *   "created_at": "2025-01-27T10:00:00.000Z",
 *   "updated_at": "2025-01-27T10:00:00.000Z"
 * }
 *
 * @example PATCH Request
 * PATCH /api/v1/profile
 * Content-Type: application/json
 * Authorization: Bearer <token>
 *
 * {}
 *
 * @example PATCH Response (200 OK)
 * {
 *   "id": "550e8400-e29b-41d4-a716-446655440000",
 *   "created_at": "2025-01-27T10:00:00.000Z",
 *   "updated_at": "2025-01-27T12:30:00.000Z"
 * }
 *
 * @example Error Response (401 Unauthorized)
 * {
 *   "error": "Unauthorized",
 *   "message": "Authentication required"
 * }
 *
 * @example Error Response (404 Not Found)
 * {
 *   "error": "Not Found",
 *   "message": "Profile not found"
 * }
 *
 * @example Error Response (400 Bad Request)
 * {
 *   "error": "Bad Request",
 *   "message": "Validation failed",
 *   "details": {
 *     "unknown_field": "Unrecognized key(s) in object: 'unknown_field'"
 *   }
 * }
 */

import type { APIRoute } from 'astro';
import { ZodError } from 'zod';
import { DEFAULT_USER_ID } from '../../../db/supabase.client';
import { ProfileService } from '../../../lib/services/profile.service';
import { updateProfileSchema } from '../../../lib/validators/profile.validators';
import { logError } from '../../../lib/helpers/error-logger';
import type { ProfileResponseDTO, ErrorResponseDTO } from '../../../types';

export const prerender = false;

/**
 * GET handler - Retrieve authenticated user's profile
 *
 * Process:
 * 1. Get user ID (currently DEFAULT_USER_ID for MVP)
 * 2. Fetch profile from ProfileService
 * 3. Return profile or 404 if not found
 *
 * RLS Policy: Users can view only their own profile
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Step 1: Get user ID
    // TODO: Replace with actual JWT authentication
    // const { data: { user }, error: authError } = await locals.supabase.auth.getUser();
    // if (authError || !user) {
    //   return new Response(
    //     JSON.stringify({
    //       error: 'Unauthorized',
    //       message: 'Authentication required'
    //     } as ErrorResponseDTO),
    //     { status: 401, headers: { 'Content-Type': 'application/json' } }
    //   );
    // }
    // const userId = user.id;

    const userId = DEFAULT_USER_ID;

    // Step 2: Fetch profile
    const profileService = new ProfileService(locals.supabase);
    const profile = await profileService.getProfile(userId);

    // Step 3: Handle not found case
    if (!profile) {
      // This should theoretically never happen as profiles are auto-created
      // on user signup, but we handle it for robustness and log it
      console.warn(`Profile not found for user ${userId} - this should not happen`);

      // Log this unexpected condition for debugging
      await logError(locals.supabase, {
        user_id: userId,
        error_type: 'profile_not_found',
        error_message: 'Profile not found despite user being authenticated',
        context: {
          endpoint: 'GET /api/v1/profile',
          user_id: userId,
        },
      });

      return new Response(
        JSON.stringify({
          error: 'Not Found',
          message: 'Profile not found',
        } as ErrorResponseDTO),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Return profile
    return new Response(JSON.stringify(profile as ProfileResponseDTO), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Unexpected error - log to database and return 500
    console.error('Error fetching profile:', error);

    const userId = DEFAULT_USER_ID;
    await logError(locals.supabase, {
      user_id: userId,
      error_type: 'profile_fetch_error',
      error_message: error instanceof Error ? error.message : String(error),
      error_details: error instanceof Error ? { stack: error.stack } : undefined,
      context: {
        endpoint: 'GET /api/v1/profile',
      },
    });

    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      } as ErrorResponseDTO),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * PATCH handler - Update authenticated user's profile
 *
 * Process:
 * 1. Get user ID (currently DEFAULT_USER_ID for MVP)
 * 2. Parse and validate request body
 * 3. Update profile via ProfileService
 * 4. Return updated profile
 *
 * Currently no fields are editable, but the endpoint is prepared
 * for future extensions (display_name, preferences, etc.)
 *
 * RLS Policy: Users can update only their own profile
 * Trigger: update_profiles_updated_at automatically sets updated_at
 */
export const PATCH: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Get user ID
    // TODO: Replace with actual JWT authentication
    // const { data: { user }, error: authError } = await locals.supabase.auth.getUser();
    // if (authError || !user) {
    //   return new Response(
    //     JSON.stringify({
    //       error: 'Unauthorized',
    //       message: 'Authentication required'
    //     } as ErrorResponseDTO),
    //     { status: 401, headers: { 'Content-Type': 'application/json' } }
    //   );
    // }
    // const userId = user.id;

    const userId = DEFAULT_USER_ID;

    // Step 2: Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: 'Invalid JSON body',
        } as ErrorResponseDTO),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Validate request body
    let validatedData;
    try {
      validatedData = updateProfileSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        // Format validation errors to match ErrorResponseDTO
        const details: Record<string, string> = {};
        error.errors.forEach((err) => {
          const field = err.path.join('.');
          details[field] = err.message;
        });

        const errorResponse: ErrorResponseDTO = {
          error: 'Bad Request',
          message: 'Validation failed',
          details,
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Unexpected validation error
      throw error;
    }

    // Step 4: Update profile
    const profileService = new ProfileService(locals.supabase);
    const updatedProfile = await profileService.updateProfile(userId, validatedData);

    // Step 5: Return updated profile
    return new Response(JSON.stringify(updatedProfile as ProfileResponseDTO), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Unexpected error - log to database and return 500
    console.error('Error updating profile:', error);

    const userId = DEFAULT_USER_ID;
    await logError(locals.supabase, {
      user_id: userId,
      error_type: 'profile_update_error',
      error_message: error instanceof Error ? error.message : String(error),
      error_details: error instanceof Error ? { stack: error.stack } : undefined,
      context: {
        endpoint: 'PATCH /api/v1/profile',
      },
    });

    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      } as ErrorResponseDTO),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
