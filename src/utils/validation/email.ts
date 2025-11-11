/**
 * Email validation utilities
 * Shared across all authentication forms
 */

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ValidationResult = {
  valid: boolean;
  error?: string;
};

/**
 * Validates email format and presence
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return {
      valid: false,
      error: "Email jest wymagany",
    };
  }

  if (!emailRegex.test(email)) {
    return {
      valid: false,
      error: "Nieprawidłowy format email",
    };
  }

  return { valid: true };
}

/**
 * Returns only the error message or undefined
 * Useful for direct error display
 */
export function getEmailError(email: string): string | undefined {
  const result = validateEmail(email);
  return result.error;
}
