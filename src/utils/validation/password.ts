/**
 * Password validation utilities
 * Composable validators for reuse across forms
 */

export type ValidationResult = {
  valid: boolean;
  error?: string;
};

export type Validator = (value: string) => string | undefined;

/**
 * Individual password validators
 */
export const passwordValidators = {
  required: (value: string): string | undefined => {
    return value ? undefined : "Hasło jest wymagane";
  },

  minLength: (value: string, min = 8): string | undefined => {
    return value.length >= min ? undefined : `Hasło musi mieć minimum ${min} znaków`;
  },

  maxLength: (value: string, max = 72): string | undefined => {
    return value.length <= max ? undefined : `Hasło może mieć maksymalnie ${max} znaki`;
  },

  match: (value: string, compareTo: string): string | undefined => {
    return value === compareTo ? undefined : "Hasła muszą być identyczne";
  },
};

/**
 * Composes multiple validators into one
 */
export function composeValidators(...validators: Validator[]): Validator {
  return (value: string) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
    return undefined;
  };
}

/**
 * Standard password validation (used in signup, password change)
 */
export const validatePassword = (password: string): string | undefined => {
  return composeValidators(
    passwordValidators.required,
    (val) => passwordValidators.minLength(val, 8),
    (val) => passwordValidators.maxLength(val, 72)
  )(password);
};

/**
 * Validates password confirmation matches original
 */
export const validatePasswordConfirm = (passwordConfirm: string, password: string): string | undefined => {
  if (!passwordConfirm) {
    return "Potwierdzenie hasła jest wymagane";
  }
  return passwordValidators.match(passwordConfirm, password);
};

/**
 * Simple required validation (for login - no length constraints)
 */
export const validatePasswordRequired = (password: string): string | undefined => {
  return passwordValidators.required(password);
};
