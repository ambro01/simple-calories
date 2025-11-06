/**
 * OpenRouter Service - AI Integration Layer
 *
 * Service for interacting with OpenRouter API to generate nutritional estimates.
 * Currently using mocked responses for development/testing.
 *
 * @module OpenRouterService
 */

import type { OpenRouterRequest, OpenRouterResponse, NutritionalEstimate } from "./openrouter-mock.types";

/**
 * System prompt that instructs the AI model how to analyze nutritional content.
 * Defines the expected JSON response format and estimation rules.
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
 * Configuration for OpenRouter service
 */
type OpenRouterConfig = {
  model: string;
  timeout: number;
};

/**
 * Mock responses for different types of prompts
 * Used during development to simulate AI behavior
 */
const MOCK_RESPONSES: Record<string, NutritionalEstimate> = {
  // Success case - specific meal description
  default: {
    calories: 650,
    protein: 45,
    carbs: 60,
    fats: 18,
    assumptions:
      "Założenia: 200g grillowanego piersi kurczaka (ok. 330 kcal), 150g ugotowanego białego ryżu (ok. 195 kcal), łyżeczka oleju (ok. 125 kcal). Typowa porcja dla osoby dorosłej.",
  },

  // Vague description - too general
  vague: {
    calories: null,
    protein: null,
    carbs: null,
    fats: null,
    assumptions: null,
    error: "Opis jest zbyt ogólny. Proszę podać konkretne danie lub produkty, które zjadłeś/aś.",
  },

  // Complex meal - multiple items
  complex: {
    calories: 1200,
    protein: 65,
    carbs: 120,
    fats: 42,
    assumptions:
      "Założenia: burger wołowy (ok. 250g, 600 kcal), średnia porcja frytek (150g, 450 kcal), sałatka coleslaw (100g, 150 kcal). Typowa porcja fast-food.",
  },
};

/**
 * Determines which mock response to use based on prompt content
 */
function getMockResponseForPrompt(prompt: string): NutritionalEstimate {
  const lowerPrompt = prompt.toLowerCase().trim();

  // Check for vague descriptions
  const vagueKeywords = [
    "lunch",
    "dinner",
    "breakfast",
    "obiad",
    "śniadanie",
    "kolacja",
    "something",
    "coś",
    "posiłek",
  ];

  if (vagueKeywords.some((keyword) => lowerPrompt === keyword)) {
    return MOCK_RESPONSES.vague;
  }

  // Check for complex meals
  const complexKeywords = ["burger", "pizza", "kebab", "zestaw", "menu"];

  if (complexKeywords.some((keyword) => lowerPrompt.includes(keyword))) {
    return MOCK_RESPONSES.complex;
  }

  // Default response for specific descriptions
  return MOCK_RESPONSES.default;
}

/**
 * Generates a mock OpenRouter API response
 *
 * @param prompt - User's meal description
 * @returns Mocked OpenRouter API response with nutritional estimate
 */
function generateMockOpenRouterResponse(prompt: string): OpenRouterResponse {
  const estimate = getMockResponseForPrompt(prompt);

  return {
    id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    model: "mock-gpt-4",
    choices: [
      {
        message: {
          role: "assistant",
          content: JSON.stringify(estimate, null, 2),
        },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: 150,
      completion_tokens: 80,
      total_tokens: 230,
    },
  };
}

/**
 * OpenRouter Service Class
 *
 * Handles communication with OpenRouter API (currently mocked).
 * Responsible for:
 * - Constructing API requests with proper prompts
 * - Parsing AI responses into structured data
 * - Error handling and validation
 */
export class OpenRouterService {
  private config: OpenRouterConfig;

  constructor(config: Partial<OpenRouterConfig> = {}) {
    this.config = {
      model: config.model || import.meta.env.OPENROUTER_MODEL || "mock-gpt-4",
      timeout: config.timeout || parseInt(import.meta.env.OPENROUTER_TIMEOUT) || 30000,
    };
  }

  /**
   * Generates a nutritional estimate for a given meal description
   *
   * @param prompt - User's description of the meal
   * @returns Nutritional estimate with macros and assumptions
   * @throws Error if API communication fails or response is invalid
   */
  async generateNutritionEstimate(prompt: string): Promise<NutritionalEstimate> {
    // Construct request payload (for logging/debugging)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const request: OpenRouterRequest = {
      model: this.config.model,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent estimates
      max_tokens: 500,
    };

    try {
      // MOCK: Simulate API call with delay
      await this.simulateApiDelay();

      // MOCK: Generate response
      const response = generateMockOpenRouterResponse(prompt);

      // Parse and validate response
      return this.parseNutritionalEstimate(response);
    } catch (error) {
      console.error("OpenRouter API Error:", error);
      throw new Error("Failed to generate nutritional estimate from AI service");
    }
  }

  /**
   * Parses OpenRouter API response into NutritionalEstimate
   *
   * @param response - Raw API response from OpenRouter
   * @returns Parsed and validated nutritional estimate
   * @throws Error if response format is invalid
   */
  private parseNutritionalEstimate(response: OpenRouterResponse): NutritionalEstimate {
    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    try {
      const parsed = JSON.parse(content) as NutritionalEstimate;

      // Validate that we have either valid estimates or an error message
      if (parsed.error) {
        return {
          calories: null,
          protein: null,
          carbs: null,
          fats: null,
          assumptions: null,
          error: parsed.error,
        };
      }

      // Validate nutritional values
      if (
        typeof parsed.calories !== "number" ||
        typeof parsed.protein !== "number" ||
        typeof parsed.carbs !== "number" ||
        typeof parsed.fats !== "number"
      ) {
        throw new Error("Invalid nutritional values in AI response");
      }

      return parsed;
    } catch (error) {
      console.error("Failed to parse AI response:", content, error);
      throw new Error("Invalid JSON response from AI service");
    }
  }

  /**
   * Simulates network delay for realistic mock behavior
   * Delay: 500-1500ms
   */
  private async simulateApiDelay(): Promise<void> {
    const delay = 500 + Math.random() * 1000; // 500-1500ms
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

/**
 * Singleton instance for use across the application
 */
export const openRouterService = new OpenRouterService();
