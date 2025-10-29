/**
 * Zod Validation Schemas for AI Generation Endpoints
 *
 * Defines validation rules for AI generation API requests.
 * Used to ensure data integrity before processing.
 */

import { z } from 'zod';

/**
 * Schema for creating a new AI generation request
 *
 * Validates:
 * - prompt must be present (non-empty string after trimming)
 * - prompt length between 1 and 1000 characters
 */
export const CreateAIGenerationSchema = z.object({
  prompt: z
    .string({
      required_error: 'Prompt is required',
      invalid_type_error: 'Prompt must be a string',
    })
    .trim()
    .min(1, 'Prompt is required and cannot be empty')
    .max(1000, 'Prompt cannot exceed 1000 characters'),
});

/**
 * Inferred TypeScript type from the Zod schema
 */
export type CreateAIGenerationInput = z.infer<typeof CreateAIGenerationSchema>;
