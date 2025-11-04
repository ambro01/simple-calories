/**
 * Auth Helper Functions
 *
 * Utilities for handling authentication in API routes.
 */

import type { ErrorResponseDTO } from "../../types";

/**
 * Get authenticated user ID from Astro.locals
 *
 * This function should be used in all protected API routes to extract
 * the authenticated user ID set by the middleware.
 *
 * @param locals - Astro.locals object from APIRoute context
 * @returns User ID if authenticated, undefined if not
 *
 * @example
 * export const GET: APIRoute = async ({ locals }) => {
 *   const userId = getUserId(locals);
 *   if (!userId) {
 *     return unauthorizedResponse();
 *   }
 *   // Use userId...
 * };
 */
export function getUserId(locals: App.Locals): string | undefined {
  return locals.user?.id;
}

/**
 * Create a standardized 401 Unauthorized response
 *
 * Use this when a user tries to access a protected endpoint without authentication.
 *
 * @returns Response with 401 status and error message
 *
 * @example
 * export const GET: APIRoute = async ({ locals }) => {
 *   const userId = getUserId(locals);
 *   if (!userId) {
 *     return unauthorizedResponse();
 *   }
 *   // Continue...
 * };
 */
export function unauthorizedResponse(): Response {
  const errorResponse: ErrorResponseDTO = {
    error: "UNAUTHORIZED",
    message: "Authentication required",
  };

  return new Response(JSON.stringify(errorResponse), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Require authentication in API route
 *
 * Convenience function that combines getUserId() and unauthorizedResponse().
 * Returns the user ID or a 401 Response.
 *
 * @param locals - Astro.locals object from APIRoute context
 * @returns User ID string or 401 Response
 *
 * @example
 * export const GET: APIRoute = async ({ locals }) => {
 *   const userIdOrResponse = requireAuth(locals);
 *   if (userIdOrResponse instanceof Response) {
 *     return userIdOrResponse; // Return 401 response
 *   }
 *   const userId = userIdOrResponse; // Use userId
 *   // Continue...
 * };
 */
export function requireAuth(locals: App.Locals): string | Response {
  const userId = getUserId(locals);
  if (!userId) {
    return unauthorizedResponse();
  }
  return userId;
}
