import type { ResponseFormat } from './openrouter.types';

// Schema dla analizy posiłku - kompatybilny z NutritionalEstimate
// Uwaga: strict mode nie obsługuje nullable fields bezpośrednio,
// więc używamy non-strict mode dla większej elastyczności
export const nutritionalEstimateSchema: ResponseFormat = {
  type: 'json_schema',
  json_schema: {
    name: 'nutritional_estimate',
    strict: false,
    schema: {
      type: 'object',
      properties: {
        calories: {
          type: 'number',
          description: 'Estimated calories (can be null if estimation failed)',
        },
        protein: {
          type: 'number',
          description: 'Estimated protein in grams (can be null if estimation failed)',
        },
        carbs: {
          type: 'number',
          description: 'Estimated carbohydrates in grams (can be null if estimation failed)',
        },
        fats: {
          type: 'number',
          description: 'Estimated fats in grams (can be null if estimation failed)',
        },
        assumptions: {
          type: 'string',
          description: 'AI assumptions about the meal (can be null if estimation failed)',
        },
        error: {
          type: 'string',
          description: 'Error message if AI could not estimate (only present if estimation failed)',
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
};

// Schema dla sugestii żywieniowych
export const nutritionSuggestionSchema: ResponseFormat = {
  type: 'json_schema',
  json_schema: {
    name: 'nutrition_suggestion',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        suggestion: {
          type: 'string',
          description: 'Główna sugestia żywieniowa',
        },
        reasoning: {
          type: 'string',
          description: 'Uzasadnienie sugestii',
        },
        priority: {
          type: 'string',
          enum: ['high', 'medium', 'low'],
          description: 'Priorytet sugestii',
        },
        category: {
          type: 'string',
          enum: ['macros', 'calories', 'timing', 'hydration', 'variety', 'general'],
          description: 'Kategoria sugestii',
        },
        action_items: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Konkretne działania do podjęcia',
        },
        expected_impact: {
          type: 'string',
          description: 'Oczekiwany wpływ na zdrowie/cele',
        },
      },
      required: [
        'suggestion',
        'reasoning',
        'priority',
        'category',
        'action_items',
      ],
      additionalProperties: false,
    },
  },
};

// Helper do tworzenia custom schema
export function createCustomSchema(
  name: string,
  properties: Record<string, any>,
  required: string[],
  strict = true
): ResponseFormat {
  return {
    type: 'json_schema',
    json_schema: {
      name,
      strict,
      schema: {
        type: 'object',
        properties,
        required,
        additionalProperties: false,
      },
    },
  };
}

// Typy wynikowe dla schemas (dla type safety)
// Kompatybilny z istniejącym NutritionalEstimate z mock service
export interface NutritionalEstimate {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  assumptions: string | null;
  error?: string;
}

export interface NutritionSuggestion {
  suggestion: string;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
  category: 'macros' | 'calories' | 'timing' | 'hydration' | 'variety' | 'general';
  action_items: string[];
  expected_impact?: string;
}
