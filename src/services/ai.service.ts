/**
 * AI Service
 * Centralized API calls for AI meal generation
 */

import type { AIGenerationResponseDTO } from "@/types";

/**
 * Custom error class for rate limiting
 */
export class RateLimitError extends Error {
  constructor(public retryAfter: number) {
    super(`Zbyt wiele żądań. Spróbuj ponownie za ${retryAfter}s`);
    this.name = "RateLimitError";
  }
}

/**
 * AI API client
 */
export const aiService = {
  /**
   * Generate meal estimation from prompt using AI
   * @throws RateLimitError if rate limited
   * @throws Error with user-friendly message for other errors
   */
  async generateMeal(prompt: string): Promise<AIGenerationResponseDTO> {
    try {
      const response = await fetch("/api/v1/ai-generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      // Handle rate limiting
      if (response.status === 429) {
        const errorData = await response.json();
        const retryAfter = errorData.retry_after || 60;
        throw new RateLimitError(retryAfter);
      }

      // Handle other errors
      if (!response.ok) {
        throw new Error("Wystąpił błąd podczas generowania. Spróbuj ponownie.");
      }

      const result: AIGenerationResponseDTO = await response.json();
      return result;
    } catch (error) {
      // If it's already our custom error, re-throw
      if (error instanceof RateLimitError) {
        throw error;
      }

      // Network error or other unexpected error
      if (error instanceof Error) {
        throw error;
      }

      throw new Error("Wystąpił błąd połączenia. Spróbuj ponownie.");
    }
  },
};
