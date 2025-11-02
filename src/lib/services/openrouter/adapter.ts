/**
 * OpenRouter Adapter
 *
 * Adapter zapewniający kompatybilność z istniejącym mock service.
 * Implementuje ten sam interfejs co openrouter-mock.service.ts
 */

import { getOpenRouterService } from './instance';
import { nutritionalEstimateSchema } from './schemas';
import type { NutritionalEstimate } from './schemas';
import { ParseError, OpenRouterError } from './errors';

/**
 * System prompt używany przez mock service - zachowujemy dla kompatybilności
 */
const SYSTEM_PROMPT = `You are a nutritional expert AI assistant. When given a description of a meal or food item, estimate its nutritional content.

IMPORTANT RULES:
1. If the description is too vague (e.g., "lunch", "dinner", "something"), respond with an error message
2. Always provide your assumptions about portion sizes and ingredients
3. Base estimates on typical serving sizes unless specified
4. Round values to whole numbers

Respond ONLY with a valid JSON object in this exact format:
{
  "calories": number or null,
  "protein": number or null,
  "carbs": number or null,
  "fats": number or null,
  "assumptions": "string or null",
  "error": "string (only if estimation is impossible)"
}

Examples:
- Valid: "grilled chicken breast 200g with rice" → provide estimates
- Too vague: "lunch" → return error: "Description too vague. Please specify what you ate."`;

/**
 * Configuration for OpenRouter adapter
 */
interface OpenRouterAdapterConfig {
  model?: string;
  timeout?: number;
}

/**
 * OpenRouter Adapter Class
 *
 * Drop-in replacement dla openrouter-mock.service.ts
 * Używa prawdziwego OpenRouter API zamiast mocków
 */
export class OpenRouterAdapter {
  private config: {
    model: string;
    timeout: number;
  };

  constructor(config: Partial<OpenRouterAdapterConfig> = {}) {
    this.config = {
      model: config.model || import.meta.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo',
      timeout: config.timeout || parseInt(import.meta.env.OPENROUTER_TIMEOUT) || 30000,
    };
  }

  /**
   * Generates a nutritional estimate for a given meal description
   *
   * Kompatybilne z metodą z mock service:
   * openRouterService.generateNutritionEstimate(prompt)
   *
   * @param prompt - User's description of the meal
   * @returns Nutritional estimate with macros and assumptions
   * @throws Error if API communication fails or response is invalid
   */
  async generateNutritionEstimate(prompt: string): Promise<NutritionalEstimate> {
    try {
      const service = getOpenRouterService();

      // Ustaw model i timeout jeśli podane w config
      if (this.config.model) {
        service.setDefaultModel(this.config.model);
      }
      if (this.config.timeout) {
        service.setTimeout(this.config.timeout);
      }

      // Wywołaj API z JSON Schema response format
      const result = await service.structuredChat<NutritionalEstimate>(
        prompt,
        nutritionalEstimateSchema,
        SYSTEM_PROMPT,
        this.config.model
      );

      // Walidacja wyniku
      if (result.error) {
        return {
          calories: null,
          protein: null,
          carbs: null,
          fats: null,
          assumptions: null,
          error: result.error,
        };
      }

      // Walidacja wartości numerycznych
      if (
        typeof result.calories !== 'number' ||
        typeof result.protein !== 'number' ||
        typeof result.carbs !== 'number' ||
        typeof result.fats !== 'number'
      ) {
        throw new ParseError('Invalid nutritional values in AI response');
      }

      return result;
    } catch (error) {
      console.error('OpenRouter API Error:', error);

      // Jeśli to błąd OpenRouter, rzuć oryginalny błąd
      if (error instanceof OpenRouterError) {
        throw error;
      }

      // W przeciwnym razie rzuć generyczny błąd
      throw new Error('Failed to generate nutritional estimate from AI service');
    }
  }
}

/**
 * Singleton instance dla kompatybilności z mock service
 *
 * Import w istniejącym kodzie:
 * import { openRouterService } from '../ai/openrouter-mock.service';
 *
 * Można zastąpić przez:
 * import { openRouterService } from '../services/openrouter/adapter';
 */
export const openRouterService = new OpenRouterAdapter();
