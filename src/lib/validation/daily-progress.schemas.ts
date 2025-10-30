/**
 * Validation Schemas for Daily Progress API
 *
 * Zod schemas for validating daily progress endpoint requests.
 * Ensures data integrity and provides clear error messages for invalid inputs.
 *
 * @module DailyProgressSchemas
 */

import { z } from 'zod';
import { isValidDateFormat, isDateInFuture, isDateRangeValid } from '../helpers/date';

/**
 * Query parameters schema for GET /api/v1/daily-progress
 *
 * Validates filtering and pagination parameters for listing daily progress.
 *
 * Rules:
 * - date_from and date_to must be in YYYY-MM-DD format
 * - date_from must be <= date_to
 * - limit must be between 1 and 100 (default: 30)
 * - offset must be >= 0 (default: 0)
 */
export const GetDailyProgressQuerySchema = z
  .object({
    date_from: z
      .string()
      .refine(isValidDateFormat, {
        message: 'Date must be in YYYY-MM-DD format',
      })
      .optional(),
    date_to: z
      .string()
      .refine(isValidDateFormat, {
        message: 'Date must be in YYYY-MM-DD format',
      })
      .optional(),
    limit: z
      .number()
      .int()
      .min(1, 'Limit must be at least 1')
      .max(100, 'Limit must be at most 100')
      .default(30),
    offset: z
      .number()
      .int()
      .min(0, 'Offset must be at least 0')
      .default(0),
  })
  .refine(
    (data) => {
      // If both dates are provided, ensure date_from <= date_to
      if (data.date_from && data.date_to) {
        return isDateRangeValid(data.date_from, data.date_to);
      }
      return true;
    },
    {
      message: 'date_from must be less than or equal to date_to',
      path: ['date_from'], // Show error on date_from field
    }
  );

/**
 * URL parameter schema for GET /api/v1/daily-progress/:date
 *
 * Validates the date parameter in the URL path.
 *
 * Rules:
 * - date must be in YYYY-MM-DD format
 * - date cannot be in the future
 */
export const GetDailyProgressDateSchema = z
  .string()
  .refine(isValidDateFormat, {
    message: 'Date must be in YYYY-MM-DD format',
  })
  .refine((date) => !isDateInFuture(date), {
    message: 'Date cannot be in the future',
  });

/**
 * Type inference for query parameters
 */
export type GetDailyProgressQuery = z.infer<typeof GetDailyProgressQuerySchema>;

/**
 * Type inference for date parameter
 */
export type GetDailyProgressDate = z.infer<typeof GetDailyProgressDateSchema>;
