import type { ModelParameters } from './openrouter.types';

// Dostępne modele OpenRouter
export const AVAILABLE_MODELS = {
  GPT4_TURBO: 'openai/gpt-4-turbo',
  GPT4: 'openai/gpt-4',
  GPT35_TURBO: 'openai/gpt-3.5-turbo',
  CLAUDE_3_OPUS: 'anthropic/claude-3-opus',
  CLAUDE_3_SONNET: 'anthropic/claude-3-sonnet',
  CLAUDE_3_HAIKU: 'anthropic/claude-3-haiku',
  GEMINI_PRO: 'google/gemini-pro',
  LLAMA_3_70B: 'meta-llama/llama-3-70b-instruct',
  LLAMA_3_8B: 'meta-llama/llama-3-8b-instruct',
} as const;

// Domyślny model
export const DEFAULT_MODEL = AVAILABLE_MODELS.GPT35_TURBO;

// Domyślne parametry modelu
export const DEFAULT_MODEL_PARAMETERS: ModelParameters = {
  temperature: 0.7,
  max_tokens: 1000,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
};

// Konfiguracja retry
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 1000,      // 1 sekunda
  MAX_DELAY: 10000,         // 10 sekund
  BACKOFF_FACTOR: 2,        // Exponential backoff
};

// Timeout dla requestów (ms)
export const REQUEST_TIMEOUT = 30000; // 30 sekund

// OpenRouter API endpoint
export const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Limity walidacji
export const VALIDATION_LIMITS = {
  MIN_TEMPERATURE: 0,
  MAX_TEMPERATURE: 2,
  MIN_TOP_P: 0,
  MAX_TOP_P: 1,
  MIN_FREQUENCY_PENALTY: -2,
  MAX_FREQUENCY_PENALTY: 2,
  MIN_PRESENCE_PENALTY: -2,
  MAX_PRESENCE_PENALTY: 2,
  MIN_MAX_TOKENS: 1,
  MAX_MAX_TOKENS: 32000,
} as const;

// Funkcja walidacji parametrów modelu
export function validateModelParameters(params: ModelParameters): void {
  if (params.temperature !== undefined) {
    if (params.temperature < VALIDATION_LIMITS.MIN_TEMPERATURE ||
        params.temperature > VALIDATION_LIMITS.MAX_TEMPERATURE) {
      throw new Error(
        `Temperature must be between ${VALIDATION_LIMITS.MIN_TEMPERATURE} and ${VALIDATION_LIMITS.MAX_TEMPERATURE}`
      );
    }
  }

  if (params.top_p !== undefined) {
    if (params.top_p < VALIDATION_LIMITS.MIN_TOP_P ||
        params.top_p > VALIDATION_LIMITS.MAX_TOP_P) {
      throw new Error(
        `top_p must be between ${VALIDATION_LIMITS.MIN_TOP_P} and ${VALIDATION_LIMITS.MAX_TOP_P}`
      );
    }
  }

  if (params.frequency_penalty !== undefined) {
    if (params.frequency_penalty < VALIDATION_LIMITS.MIN_FREQUENCY_PENALTY ||
        params.frequency_penalty > VALIDATION_LIMITS.MAX_FREQUENCY_PENALTY) {
      throw new Error(
        `frequency_penalty must be between ${VALIDATION_LIMITS.MIN_FREQUENCY_PENALTY} and ${VALIDATION_LIMITS.MAX_FREQUENCY_PENALTY}`
      );
    }
  }

  if (params.presence_penalty !== undefined) {
    if (params.presence_penalty < VALIDATION_LIMITS.MIN_PRESENCE_PENALTY ||
        params.presence_penalty > VALIDATION_LIMITS.MAX_PRESENCE_PENALTY) {
      throw new Error(
        `presence_penalty must be between ${VALIDATION_LIMITS.MIN_PRESENCE_PENALTY} and ${VALIDATION_LIMITS.MAX_PRESENCE_PENALTY}`
      );
    }
  }

  if (params.max_tokens !== undefined) {
    if (params.max_tokens < VALIDATION_LIMITS.MIN_MAX_TOKENS ||
        params.max_tokens > VALIDATION_LIMITS.MAX_MAX_TOKENS) {
      throw new Error(
        `max_tokens must be between ${VALIDATION_LIMITS.MIN_MAX_TOKENS} and ${VALIDATION_LIMITS.MAX_MAX_TOKENS}`
      );
    }
  }
}

// Funkcja sprawdzająca czy model istnieje
export function isValidModel(model: string): boolean {
  return Object.values(AVAILABLE_MODELS).includes(model as any);
}
