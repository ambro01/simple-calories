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
const SYSTEM_PROMPT = `Jesteś ekspertem ds. żywienia i dietetyki. Twoim zadaniem jest oszacowanie wartości odżywczych posiłku na podstawie opisu podanego przez użytkownika.

WAŻNE ZASADY:
1. Jeśli opis jest zbyt ogólny (np. "obiad", "kolacja", "coś"), odpowiedz komunikatem o błędzie
2. Zawsze podawaj swoje założenia dotyczące wielkości porcji i składników
3. Opieraj oszacowania na typowych porcjach, chyba że określono inaczej
4. Zaokrąglaj wartości do liczb całkowitych
5. ZAWSZE odpowiadaj w języku polskim

Odpowiedz TYLKO poprawnym obiektem JSON w dokładnie takim formacie:
{
  "calories": number lub null,
  "protein": number lub null,
  "carbs": number lub null,
  "fats": number lub null,
  "assumptions": "string lub null (PO POLSKU)",
  "error": "string (tylko jeśli oszacowanie jest niemożliwe, PO POLSKU)"
}

Przykłady:
- Poprawny opis: "pierś z kurczaka z grilla 200g z ryżem" → podaj oszacowania z założeniami po polsku
- Zbyt ogólny: "obiad" → zwróć błąd: "Opis zbyt ogólny. Proszę sprecyzować, co jadłeś/aś."`;


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
