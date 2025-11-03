/**
 * Error Logger Helper
 *
 * Centralized error logging utility for storing application errors
 * in the error_logs database table.
 *
 * This helper provides a consistent interface for logging errors with
 * contextual information, user tracking, and structured error details.
 *
 * @module ErrorLogger
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";

/**
 * Parameters for logging an error to the database
 */
export interface ErrorLogParams {
  /**
   * User ID associated with the error (optional)
   * Should be omitted for unauthenticated errors
   */
  user_id?: string;

  /**
   * Error type identifier for categorization
   * @example 'profile_fetch_error', 'validation_error', 'database_error'
   */
  error_type: string;

  /**
   * Human-readable error message
   * Should not contain sensitive information
   */
  error_message: string;

  /**
   * Structured error details (optional)
   * Can include stack traces, request details, etc.
   * @example { stack: error.stack, code: error.code }
   */
  error_details?: Record<string, unknown>;

  /**
   * Additional context about where/when the error occurred (optional)
   * @example { endpoint: 'GET /api/v1/profile', timestamp: Date.now() }
   */
  context?: Record<string, unknown>;
}

/**
 * Logs an error to the error_logs database table
 *
 * This function should be called for all 500-level errors that need
 * to be tracked and monitored. It will attempt to insert the error
 * into the database, and if that fails, it will fall back to console.error.
 *
 * Errors that should NOT be logged:
 * - 400 Bad Request (validation errors) - these are user errors
 * - 401 Unauthorized - normal authentication failures
 * - 404 Not Found - expected missing resources
 *
 * Errors that SHOULD be logged:
 * - 500 Internal Server Error - unexpected application errors
 * - Database connection errors
 * - Third-party API failures (OpenRouter, etc.)
 * - Unexpected null/undefined values that shouldn't occur
 *
 * @param supabase - Supabase client instance
 * @param params - Error logging parameters
 *
 * @example
 * ```typescript
 * try {
 *   const profile = await ProfileService.getProfile(userId);
 * } catch (error) {
 *   await logError(supabase, {
 *     user_id: userId,
 *     error_type: 'profile_fetch_error',
 *     error_message: error.message,
 *     error_details: { stack: error.stack },
 *     context: { endpoint: 'GET /api/v1/profile' }
 *   });
 * }
 * ```
 */
export async function logError(supabase: SupabaseClient<Database>, params: ErrorLogParams): Promise<void> {
  try {
    // Insert error log into database
    const { error } = await supabase.from("error_logs").insert({
      user_id: params.user_id ?? null,
      error_type: params.error_type,
      error_message: params.error_message,
      error_details: (params.error_details ?? null) as any,
      context: (params.context ?? null) as any,
    });

    if (error) {
      // If insert failed, log to console as fallback
      console.error("Failed to insert error log into database:", error);
      console.error("Original error:", params);
    }
  } catch (logError) {
    // If the entire logging process failed, log to console as fallback
    console.error("Failed to log error to database:", logError);
    console.error("Original error:", params);
  }
}

/**
 * Creates a standardized error log entry from a caught error
 *
 * Utility function to extract common error properties and format them
 * for logging. Handles both Error instances and unknown error types.
 *
 * @param error - The caught error (any type)
 * @param errorType - Error type identifier
 * @param userId - Optional user ID
 * @param context - Optional context information
 * @returns Formatted ErrorLogParams
 *
 * @example
 * ```typescript
 * try {
 *   // some code
 * } catch (error) {
 *   const logParams = formatErrorForLogging(
 *     error,
 *     'profile_update_error',
 *     userId,
 *     { endpoint: 'PATCH /api/v1/profile' }
 *   );
 *   await logError(supabase, logParams);
 * }
 * ```
 */
export function formatErrorForLogging(
  error: unknown,
  errorType: string,
  userId?: string,
  context?: Record<string, unknown>
): ErrorLogParams {
  // Extract error message
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Extract error details
  const errorDetails: Record<string, unknown> = {};

  if (error instanceof Error) {
    errorDetails.name = error.name;
    errorDetails.stack = error.stack;

    // Include any additional properties from the error object
    Object.keys(error).forEach((key) => {
      if (key !== "message" && key !== "name" && key !== "stack") {
        errorDetails[key] = (error as any)[key];
      }
    });
  }

  return {
    user_id: userId,
    error_type: errorType,
    error_message: errorMessage,
    error_details: Object.keys(errorDetails).length > 0 ? errorDetails : undefined,
    context,
  };
}
