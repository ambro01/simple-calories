/**
 * AIMode Component
 *
 * Interface for AI-powered meal entry including:
 * - Textarea for meal description prompt
 * - Example chips for quick prompts
 * - Generate button
 * - Loading state with multi-stage progress
 * - AI result display or error handling
 *
 * @component
 * @example
 * <AIMode
 *   prompt={prompt}
 *   onPromptChange={(value) => setPrompt(value)}
 *   aiResult={result}
 *   aiLoading={loading}
 *   aiLoadingStage={stage}
 *   aiError={error}
 *   onGenerate={handleGenerate}
 *   onAcceptResult={handleAccept}
 *   onRegenerate={handleRegenerate}
 *   onSwitchToManual={switchToManual}
 * />
 */

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, AlertCircle } from "lucide-react";
import type { AIModeProps } from "../../../types/add-meal.types";
import { CharacterCounter } from "../CharacterCounter";
import { ExampleChips } from "../ExampleChips";
import { LoadingState } from "../LoadingState";
import { AIResult } from "./AIResult";
import { MEAL_EXAMPLES, VALIDATION_LIMITS } from "../../../lib/constants/meal-form.constants";
import { validatePrompt } from "../../../lib/validation/meal-form.validation";

export function AIMode({
  prompt,
  onPromptChange,
  aiResult,
  aiLoading,
  aiLoadingStage,
  aiError,
  onGenerate,
  onRegenerate,
  onSwitchToManual,
}: AIModeProps) {
  const promptError = validatePrompt(prompt);
  const isGenerateDisabled = !!promptError || aiLoading;
  const hasSuccessResult = aiResult?.status === "completed";
  const hasFailedResult = aiResult?.status === "failed";

  return (
    <div className="space-y-4">
      {/* Prompt Input */}
      <div className="space-y-2">
        <Label htmlFor="ai-prompt" className="text-sm font-medium">
          Opis posiłku
        </Label>
        <Textarea
          id="ai-prompt"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="np. Jajecznica z trzech jajek na maśle i kromka chleba pełnoziarnistego"
          maxLength={VALIDATION_LIMITS.PROMPT_MAX_LENGTH}
          rows={4}
          disabled={aiLoading}
          className="resize-none"
        />
        <div className="flex items-center justify-between">
          <CharacterCounter current={prompt.length} max={VALIDATION_LIMITS.PROMPT_MAX_LENGTH} />
          {promptError && <span className="text-xs text-destructive">{promptError.message}</span>}
        </div>
      </div>

      {/* Example Chips */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Przykłady:</p>
        <ExampleChips examples={MEAL_EXAMPLES} onSelect={onPromptChange} disabled={aiLoading} />
      </div>

      {/* Generate Button */}
      {!aiLoading && !hasSuccessResult && (
        <Button type="button" onClick={onGenerate} disabled={isGenerateDisabled} className="w-full">
          <Sparkles className="mr-2 h-4 w-4" />
          Oblicz kalorie
        </Button>
      )}

      {/* Loading State */}
      {aiLoading && <LoadingState stage={aiLoadingStage} />}

      {/* AI Error - Network or Server Error */}
      {aiError && !hasFailedResult && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="space-y-3">
            <p className="text-sm">{aiError}</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onGenerate}>
                Spróbuj ponownie
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={onSwitchToManual}>
                Edytuj ręcznie
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* AI Result - Failed (Unclear Description) */}
      {hasFailedResult && (
        <Alert variant="warning" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
          <AlertDescription className="space-y-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              {aiResult.error_message || "Nie udało się wygenerować oszacowania."}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                className="border-yellow-600 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-500 dark:text-yellow-400 dark:hover:bg-yellow-900/30"
              >
                Generuj ponownie
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onSwitchToManual}
                className="text-yellow-700 hover:bg-yellow-100 dark:text-yellow-400 dark:hover:bg-yellow-900/30"
              >
                Edytuj ręcznie
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* AI Result - Success */}
      {hasSuccessResult && (
        <AIResult
          result={aiResult}
          onRegenerate={onRegenerate}
          onEditManually={onSwitchToManual}
          regenerateLoading={aiLoading}
        />
      )}
    </div>
  );
}
