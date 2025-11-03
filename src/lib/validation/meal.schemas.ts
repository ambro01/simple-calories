/**
 * Zod Validation Schemas for Meals Endpoints
 *
 * Defines validation rules for meals API requests.
 * Used to ensure data integrity before processing.
 */

import { z } from "zod";

/**
 * Schema for meal category enum
 * Valid values: breakfast, lunch, dinner, snack, other
 */
export const MealCategorySchema = z.enum(["breakfast", "lunch", "dinner", "snack", "other"]);

/**
 * Schema for input method enum
 * Valid values: ai, manual, ai-edited
 */
export const InputMethodSchema = z.enum(["ai", "manual", "ai-edited"]);

/**
 * Custom refinement to validate meal_timestamp is not in the future
 * Includes 1-minute buffer to account for clock skew
 */
const validateMealTimestamp = (timestamp: string) => {
  const mealDate = new Date(timestamp);
  const now = new Date();
  const buffer = 60 * 1000; // 1 minute in milliseconds

  return mealDate.getTime() <= now.getTime() + buffer;
};

/**
 * Schema for creating an AI-generated meal
 * Requires ai_generation_id to link to the AI generation
 */
export const CreateAIMealSchema = z.object({
  description: z
    .string({
      required_error: "Description is required",
      invalid_type_error: "Description must be a string",
    })
    .trim()
    .min(1, "Description is required and cannot be empty")
    .max(500, "Description cannot exceed 500 characters"),

  calories: z
    .number({
      required_error: "Calories is required",
      invalid_type_error: "Calories must be a number",
    })
    .int("Calories must be an integer")
    .min(1, "Calories must be at least 1")
    .max(10000, "Calories cannot exceed 10000"),

  protein: z
    .number({
      invalid_type_error: "Protein must be a number",
    })
    .min(0, "Protein cannot be negative")
    .max(1000, "Protein cannot exceed 1000")
    .nullable()
    .optional(),

  carbs: z
    .number({
      invalid_type_error: "Carbs must be a number",
    })
    .min(0, "Carbs cannot be negative")
    .max(1000, "Carbs cannot exceed 1000")
    .nullable()
    .optional(),

  fats: z
    .number({
      invalid_type_error: "Fats must be a number",
    })
    .min(0, "Fats cannot be negative")
    .max(1000, "Fats cannot exceed 1000")
    .nullable()
    .optional(),

  category: MealCategorySchema.nullable().optional(),

  input_method: z.literal("ai"),

  ai_generation_id: z
    .string({
      required_error: "AI generation ID is required for AI-generated meals",
      invalid_type_error: "AI generation ID must be a string",
    })
    .uuid("AI generation ID must be a valid UUID"),

  meal_timestamp: z
    .string({
      required_error: "Meal timestamp is required",
      invalid_type_error: "Meal timestamp must be a string",
    })
    .datetime("Meal timestamp must be a valid ISO 8601 datetime")
    .refine(validateMealTimestamp, {
      message: "Meal timestamp cannot be in the future",
    }),
});

/**
 * Schema for creating a manual meal
 * No ai_generation_id required
 */
export const CreateManualMealSchema = z.object({
  description: z
    .string({
      required_error: "Description is required",
      invalid_type_error: "Description must be a string",
    })
    .trim()
    .min(1, "Description is required and cannot be empty")
    .max(500, "Description cannot exceed 500 characters"),

  calories: z
    .number({
      required_error: "Calories is required",
      invalid_type_error: "Calories must be a number",
    })
    .int("Calories must be an integer")
    .min(1, "Calories must be at least 1")
    .max(10000, "Calories cannot exceed 10000"),

  protein: z
    .number({
      invalid_type_error: "Protein must be a number",
    })
    .min(0, "Protein cannot be negative")
    .max(1000, "Protein cannot exceed 1000")
    .nullable()
    .optional(),

  carbs: z
    .number({
      invalid_type_error: "Carbs must be a number",
    })
    .min(0, "Carbs cannot be negative")
    .max(1000, "Carbs cannot exceed 1000")
    .nullable()
    .optional(),

  fats: z
    .number({
      invalid_type_error: "Fats must be a number",
    })
    .min(0, "Fats cannot be negative")
    .max(1000, "Fats cannot exceed 1000")
    .nullable()
    .optional(),

  category: MealCategorySchema.nullable().optional(),

  input_method: z.literal("manual"),

  meal_timestamp: z
    .string({
      required_error: "Meal timestamp is required",
      invalid_type_error: "Meal timestamp must be a string",
    })
    .datetime("Meal timestamp must be a valid ISO 8601 datetime")
    .refine(validateMealTimestamp, {
      message: "Meal timestamp cannot be in the future",
    }),
});

/**
 * Schema for creating a meal - discriminated union based on input_method
 * Automatically validates the correct structure based on input_method field
 */
export const CreateMealSchema = z.discriminatedUnion("input_method", [CreateAIMealSchema, CreateManualMealSchema]);

/**
 * Schema for updating an existing meal
 * All fields are optional for partial updates
 * Note: input_method change to 'ai-edited' is handled in business logic
 */
export const UpdateMealSchema = z.object({
  description: z
    .string({
      invalid_type_error: "Description must be a string",
    })
    .trim()
    .min(1, "Description cannot be empty")
    .max(500, "Description cannot exceed 500 characters")
    .optional(),

  calories: z
    .number({
      invalid_type_error: "Calories must be a number",
    })
    .int("Calories must be an integer")
    .min(1, "Calories must be at least 1")
    .max(10000, "Calories cannot exceed 10000")
    .optional(),

  protein: z
    .number({
      invalid_type_error: "Protein must be a number",
    })
    .min(0, "Protein cannot be negative")
    .max(1000, "Protein cannot exceed 1000")
    .nullable()
    .optional(),

  carbs: z
    .number({
      invalid_type_error: "Carbs must be a number",
    })
    .min(0, "Carbs cannot be negative")
    .max(1000, "Carbs cannot exceed 1000")
    .nullable()
    .optional(),

  fats: z
    .number({
      invalid_type_error: "Fats must be a number",
    })
    .min(0, "Fats cannot be negative")
    .max(1000, "Fats cannot exceed 1000")
    .nullable()
    .optional(),

  category: MealCategorySchema.nullable().optional(),

  meal_timestamp: z
    .string({
      invalid_type_error: "Meal timestamp must be a string",
    })
    .datetime("Meal timestamp must be a valid ISO 8601 datetime")
    .refine(validateMealTimestamp, {
      message: "Meal timestamp cannot be in the future",
    })
    .optional(),

  input_method: InputMethodSchema.optional(),
});

/**
 * Schema for GET /api/v1/meals query parameters
 * Supports filtering by date, date range, category, and pagination
 */
export const GetMealsQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional(),

  date_from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date from must be in YYYY-MM-DD format")
    .optional(),

  date_to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date to must be in YYYY-MM-DD format")
    .optional(),

  category: MealCategorySchema.optional(),

  limit: z
    .number({
      invalid_type_error: "Limit must be a number",
    })
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .default(50),

  offset: z
    .number({
      invalid_type_error: "Offset must be a number",
    })
    .int("Offset must be an integer")
    .min(0, "Offset cannot be negative")
    .default(0),

  sort: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * Inferred TypeScript types from Zod schemas
 */
export type CreateAIMealInput = z.infer<typeof CreateAIMealSchema>;
export type CreateManualMealInput = z.infer<typeof CreateManualMealSchema>;
export type CreateMealInput = z.infer<typeof CreateMealSchema>;
export type UpdateMealInput = z.infer<typeof UpdateMealSchema>;
export type GetMealsQueryInput = z.infer<typeof GetMealsQuerySchema>;
