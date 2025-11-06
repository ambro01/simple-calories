/**
 * Profile Validation Schemas
 *
 * Zod schemas for validating Profile API request bodies.
 * Ensures type safety and data integrity at the API boundary.
 *
 * @module ProfileValidators
 */

import { z } from "zod";

/**
 * Schema for PATCH /api/v1/profile request body
 *
 * Currently empty (no editable fields) but reserved for future extensions
 * such as display_name, avatar_url, preferences, etc.
 *
 * The .strict() modifier ensures no unknown fields are accepted,
 * providing forward compatibility and clear API contracts.
 *
 * @example Valid request
 * {}
 *
 * @example Invalid request (unknown field)
 * { "display_name": "John" } // Rejected by .strict()
 */
export const updateProfileSchema = z
  .object({
    // Currently no editable fields
    // Future fields could include:
    // display_name: z.string().min(1).max(100).optional(),
    // avatar_url: z.string().url().optional(),
    // preferences: z.record(z.unknown()).optional(),
  })
  .strict(); // Reject any unknown properties

/**
 * Inferred TypeScript type from updateProfileSchema
 * Can be used for type checking without runtime validation
 */
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Schema for PATCH /api/v1/profile/password request body
 *
 * Validates password change requests with current and new password.
 * Both passwords must meet security requirements.
 *
 * @example Valid request
 * {
 *   "currentPassword": "OldPass123!",
 *   "newPassword": "NewSecurePass456!"
 * }
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Aktualne hasło jest wymagane"),
    newPassword: z
      .string()
      .min(8, "Nowe hasło musi mieć co najmniej 8 znaków")
      .max(100, "Nowe hasło nie może przekraczać 100 znaków"),
  })
  .strict();

/**
 * Inferred TypeScript type from changePasswordSchema
 */
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
