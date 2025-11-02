/**
 * OpenRouter API Type Definitions
 *
 * Types for interacting with OpenRouter.ai API for AI-powered nutritional estimation.
 * Currently using mocked responses for development.
 *
 * @see https://openrouter.ai/docs
 */

/**
 * Request payload for OpenRouter API
 */
export interface OpenRouterRequest {
  /** Model identifier (e.g., "gpt-4", "claude-2") */
  model: string;

  /** Array of messages forming the conversation */
  messages: {
    role: "system" | "user" | "assistant";
    content: string;
  }[];

  /** Sampling temperature (0-2). Lower = more deterministic */
  temperature?: number;

  /** Maximum tokens to generate in response */
  max_tokens?: number;
}

/**
 * Response from OpenRouter API
 */
export interface OpenRouterResponse {
  /** Unique identifier for this completion */
  id: string;

  /** Model that was used for generation */
  model: string;

  /** Generated completions */
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];

  /** Token usage statistics */
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Nutritional estimate result from AI processing
 * Contains either successful estimates or error information
 */
export interface NutritionalEstimate {
  /** Estimated calories (null if estimation failed) */
  calories: number | null;

  /** Estimated protein in grams (null if estimation failed) */
  protein: number | null;

  /** Estimated carbohydrates in grams (null if estimation failed) */
  carbs: number | null;

  /** Estimated fats in grams (null if estimation failed) */
  fats: number | null;

  /** AI's assumptions about the meal (null if estimation failed) */
  assumptions: string | null;

  /** Error message if AI couldn't estimate (undefined if successful) */
  error?: string;
}

/**
 * OpenRouter API error response
 */
export interface OpenRouterError {
  error: {
    message: string;
    type: string;
    code: string;
  };
}
