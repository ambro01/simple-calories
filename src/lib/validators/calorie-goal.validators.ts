/**
 * Calorie Goal Validation Schemas
 *
 * Zod schemas for validating Calorie Goals API request bodies and parameters.
 * Ensures type safety and data integrity at the API boundary.
 *
 * Validation rules match database constraints:
 * - daily_goal: INTEGER CHECK (daily_goal > 0 AND daily_goal <= 10000)
 * - effective_from: DATE (YYYY-MM-DD format)
 * - id: UUID v4 format
 *
 * @module CalorieGoalValidators
 */

import { z } from 'zod';

/**
 * Schema for POST /api/v1/calorie-goals request body
 *
 * Validates daily_goal within allowed range (1-10000).
 * The effective_from is calculated server-side as CURRENT_DATE + 1.
 *
 * @example Valid request
 * { "daily_goal": 2500 }
 *
 * @example Invalid request (out of range)
 * { "daily_goal": 15000 } // Rejected: exceeds max 10000
 *
 * @example Invalid request (not integer)
 * { "daily_goal": 2500.5 } // Rejected: must be integer
 */
export const createCalorieGoalSchema = z.object({
  daily_goal: z
    .number({
      required_error: 'Daily goal is required',
      invalid_type_error: 'Daily goal must be a number',
    })
    .int('Daily goal must be an integer')
    .min(1, 'Daily goal must be at least 1')
    .max(10000, 'Daily goal cannot exceed 10000'),
});

/**
 * Schema for PATCH /api/v1/calorie-goals/:id request body
 *
 * Same validation as create schema. Only daily_goal can be updated;
 * effective_from is immutable (if user wants to change date, must DELETE + POST).
 *
 * @example Valid request
 * { "daily_goal": 2600 }
 */
export const updateCalorieGoalSchema = z.object({
  daily_goal: z
    .number({
      required_error: 'Daily goal is required',
      invalid_type_error: 'Daily goal must be a number',
    })
    .int('Daily goal must be an integer')
    .min(1, 'Daily goal must be at least 1')
    .max(10000, 'Daily goal cannot exceed 10000'),
});

/**
 * Schema for date query parameter (YYYY-MM-DD format)
 *
 * Used by GET /api/v1/calorie-goals/current?date=YYYY-MM-DD
 * Optional - defaults to today if not provided.
 *
 * Validates format but not actual date validity (e.g., 2025-02-30 would pass regex).
 * PostgreSQL will handle invalid dates gracefully.
 *
 * @example Valid dates
 * "2025-01-27", "2024-12-31", "2025-02-01"
 *
 * @example Invalid dates (regex fails)
 * "2025-1-27" (missing leading zero)
 * "01/27/2025" (wrong format)
 * "2025-13-01" (month > 12, but passes regex - handled by DB)
 */
export const dateQueryParamSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Date must be in YYYY-MM-DD format'
  )
  .optional();

/**
 * Schema for UUID parameter validation
 *
 * Used by PATCH /api/v1/calorie-goals/:id and DELETE /api/v1/calorie-goals/:id
 * Validates UUID v4 format to prevent injection and improve error messages.
 *
 * @example Valid UUID
 * "550e8400-e29b-41d4-a716-446655440000"
 *
 * @example Invalid UUID
 * "not-a-uuid" // Rejected: invalid format
 * "123" // Rejected: invalid format
 */
export const uuidParamSchema = z
  .string()
  .uuid('Invalid UUID format');

/**
 * Inferred TypeScript types from Zod schemas
 *
 * Can be used for type checking without runtime validation.
 * Useful for internal functions that receive pre-validated data.
 */
export type CreateCalorieGoalInput = z.infer<typeof createCalorieGoalSchema>;
export type UpdateCalorieGoalInput = z.infer<typeof updateCalorieGoalSchema>;
