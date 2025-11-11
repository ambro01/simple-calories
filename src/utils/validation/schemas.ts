/**
 * Zod validation schemas for forms
 * Used with React Hook Form
 */

import { z } from "zod";

/**
 * Email field schema
 */
export const emailSchema = z.string().min(1, "Email jest wymagany").email("Nieprawidłowy format email");

/**
 * Password field schema (for signup/change password)
 */
export const passwordSchema = z
  .string()
  .min(1, "Hasło jest wymagane")
  .min(8, "Hasło musi mieć minimum 8 znaków")
  .max(72, "Hasło może mieć maksymalnie 72 znaki");

/**
 * Password field schema (for login - no length constraints)
 */
export const passwordRequiredSchema = z.string().min(1, "Hasło jest wymagane");

/**
 * Signup form schema
 */
export const signupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    passwordConfirm: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Hasła muszą być identyczne",
    path: ["passwordConfirm"],
  });

export type SignupFormData = z.infer<typeof signupSchema>;

/**
 * Login form schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordRequiredSchema,
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Forgot password form schema
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * Reset password form schema
 */
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    passwordConfirm: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Hasła muszą być identyczne",
    path: ["passwordConfirm"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/**
 * Change password form schema
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Aktualne hasło jest wymagane"),
    newPassword: passwordSchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Nowe hasło musi być różne od obecnego",
    path: ["newPassword"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

/**
 * Calorie Goal form schema
 */
export const calorieGoalSchema = z.object({
  dailyGoal: z.coerce
    .number({
      required_error: "Cel kaloryczny jest wymagany",
      invalid_type_error: "Cel musi być liczbą",
    })
    .int("Cel musi być liczbą całkowitą")
    .min(1, "Cel musi być większy lub równy 1")
    .max(10000, "Cel musi być mniejszy lub równy 10000"),
});

export type CalorieGoalFormData = z.infer<typeof calorieGoalSchema>;

/**
 * Manual Meal form schema
 */
export const manualMealSchema = z.object({
  description: z.string().min(1, "Opis jest wymagany").max(200, "Opis może mieć maksymalnie 200 znaków"),
  calories: z.coerce
    .number({ required_error: "Kalorie są wymagane", invalid_type_error: "Kalorie muszą być liczbą" })
    .int("Kalorie muszą być liczbą całkowitą")
    .min(1, "Kalorie muszą być większe od 0")
    .max(10000, "Kalorie nie mogą przekraczać 10000"),
  protein: z.coerce.number().int().min(0).max(1000).nullable(),
  carbs: z.coerce.number().int().min(0).max(1000).nullable(),
  fats: z.coerce.number().int().min(0).max(1000).nullable(),
  fiber: z.coerce.number().int().min(0).max(200).nullable(),
  category: z.enum(["breakfast", "lunch", "dinner", "snack", "other"]).nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Nieprawidłowy format daty"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Nieprawidłowy format czasu"),
});

export type ManualMealFormData = z.infer<typeof manualMealSchema>;

/**
 * AI Meal form schema
 * Note: This schema is for the form inputs only.
 * After AI generation, the actual meal data will be populated from AI result.
 */
export const aiMealSchema = z.object({
  aiPrompt: z.string().min(3, "Prompt musi mieć minimum 3 znaki").max(500, "Prompt może mieć maksymalnie 500 znaków"),
  // Common fields (populated after AI accepts result)
  category: z.enum(["breakfast", "lunch", "dinner", "snack", "other"]).nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Nieprawidłowy format daty"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Nieprawidłowy format czasu"),
});

export type AIMealFormData = z.infer<typeof aiMealSchema>;
