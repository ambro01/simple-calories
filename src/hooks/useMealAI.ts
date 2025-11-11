/**
 * useMealAI Hook
 *
 * Hook zarządzający logiką AI generation dla formularza posiłków.
 * Obsługuje generowanie AI, multi-stage loading, i handling wyników.
 */

import { useState, useCallback } from "react";
import type { AIGenerationResponseDTO } from "@/types";
import { aiService, RateLimitError } from "@/services/ai.service";

export type UseMealAIReturn = {
  aiResult: AIGenerationResponseDTO | null;
  aiLoading: boolean;
  aiLoadingStage: number;
  aiError: string | null;
  generateAI: (prompt: string) => Promise<void>;
  resetAI: () => void;
};

export function useMealAI(): UseMealAIReturn {
  const [aiResult, setAiResult] = useState<AIGenerationResponseDTO | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLoadingStage, setAiLoadingStage] = useState(0);
  const [aiError, setAiError] = useState<string | null>(null);

  /**
   * Generate AI meal estimation from prompt
   */
  const generateAI = useCallback(async (prompt: string) => {
    // Reset state
    setAiLoading(true);
    setAiLoadingStage(0);
    setAiError(null);
    setAiResult(null);

    // Multi-stage loading simulation for better UX
    const stageTimer1 = setTimeout(() => {
      setAiLoadingStage(1);
    }, 1000);

    const stageTimer2 = setTimeout(() => {
      setAiLoadingStage(2);
    }, 2000);

    try {
      const result = await aiService.generateMeal(prompt);

      setAiResult(result);
      setAiLoading(false);

      // If generation failed, set error
      if (result.status === "failed") {
        setAiError("AI nie mogło przetworzyć tego opisu. Spróbuj być bardziej szczegółowy.");
      }
    } catch (error) {
      setAiLoading(false);

      if (error instanceof RateLimitError) {
        setAiError(error.message);
      } else {
        const errorMessage = error instanceof Error ? error.message : "Wystąpił błąd połączenia. Spróbuj ponownie.";
        setAiError(errorMessage);
      }
    } finally {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
    }
  }, []);

  /**
   * Reset AI state
   */
  const resetAI = useCallback(() => {
    setAiResult(null);
    setAiLoading(false);
    setAiLoadingStage(0);
    setAiError(null);
  }, []);

  return {
    aiResult,
    aiLoading,
    aiLoadingStage,
    aiError,
    generateAI,
    resetAI,
  };
}
