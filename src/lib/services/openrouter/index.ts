// Główna klasa usługi
export { OpenRouterService } from "./openrouter.service";

// Typy
export type {
  MessageRole,
  Message,
  ModelParameters,
  ResponseFormat,
  OpenRouterRequest,
  OpenRouterResponse,
  ChatCompletionOptions,
  ParsedResponse,
} from "./openrouter.types";

// Błędy
export {
  OpenRouterError,
  UnauthorizedError,
  RateLimitError,
  ValidationError,
  ServerError,
  TimeoutError,
  ParseError,
  QuotaExceededError,
} from "./errors";

// Schematy
export { nutritionalEstimateSchema, nutritionSuggestionSchema, createCustomSchema } from "./schemas";

export type { NutritionalEstimate, NutritionSuggestion } from "./schemas";

// Konfiguracja
export {
  AVAILABLE_MODELS,
  DEFAULT_MODEL,
  DEFAULT_MODEL_PARAMETERS,
  RETRY_CONFIG,
  REQUEST_TIMEOUT,
  OPENROUTER_API_URL,
  VALIDATION_LIMITS,
  validateModelParameters,
  isValidModel,
} from "./config";

// Singleton instance
export { getOpenRouterService, resetOpenRouterService } from "./instance";

// Adapter kompatybilny z mock service
export { OpenRouterAdapter, openRouterService } from "./adapter";
