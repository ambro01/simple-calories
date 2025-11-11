/**
 * AIMode Component (Refactored with React Hook Form + useMealAI)
 *
 * Interface for AI-powered meal entry with React Hook Form integration.
 */

import type { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, AlertCircle } from "lucide-react";
import type { AIMealFormData } from "@/utils/validation/schemas";
import type { UseMealAIReturn } from "@/hooks/useMealAI";
import { CharacterCounter } from "../CharacterCounter";
import { ExampleChips } from "../ExampleChips";
import { LoadingState } from "../LoadingState";
import { AIResult } from "./AIResult";
import { MEAL_EXAMPLES, VALIDATION_LIMITS } from "../../../lib/constants/meal-form.constants";

type AIModeProps = {
  form: UseFormReturn<AIMealFormData>;
  ai: UseMealAIReturn;
  onSwitchToManual: () => void;
};

export function AIMode({ form, ai, onSwitchToManual }: AIModeProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = form;
  const aiPrompt = watch("aiPrompt");

  const isGenerateDisabled = !aiPrompt || aiPrompt.length < 3 || ai.aiLoading;
  const hasSuccessResult = ai.aiResult?.status === "completed";
  const hasFailedResult = ai.aiResult?.status === "failed";

  const handleGenerate = async () => {
    const prompt = form.getValues("aiPrompt");
    if (prompt && prompt.length >= 3) {
      await ai.generateAI(prompt);
    }
  };

  return (
    <div className="space-y-4">
      {/* Prompt Input */}
      <div className="space-y-2">
        <Label htmlFor="ai-prompt" className="text-sm font-medium">
          Opis posiłku
        </Label>
        <Textarea
          id="ai-prompt"
          {...register("aiPrompt")}
          placeholder="np. Jajecznica z trzech jajek na maśle i kromka chleba pełnoziarnistego"
          maxLength={VALIDATION_LIMITS.PROMPT_MAX_LENGTH}
          rows={4}
          disabled={ai.aiLoading}
          className="resize-none"
        />
        <div className="flex items-center justify-between">
          <CharacterCounter current={aiPrompt.length} max={VALIDATION_LIMITS.PROMPT_MAX_LENGTH} />
          {errors.aiPrompt && <span className="text-xs text-destructive">{errors.aiPrompt.message}</span>}
        </div>
      </div>

      {/* Example Chips */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Przykłady:</p>
        <ExampleChips
          examples={MEAL_EXAMPLES}
          onSelect={(value) => form.setValue("aiPrompt", value, { shouldDirty: true })}
          disabled={ai.aiLoading}
        />
      </div>

      {/* Generate Button */}
      {!ai.aiLoading && !hasSuccessResult && (
        <Button type="button" onClick={handleGenerate} disabled={isGenerateDisabled} className="w-full">
          <Sparkles className="mr-2 h-4 w-4" />
          Oblicz kalorie
        </Button>
      )}

      {/* Loading State */}
      {ai.aiLoading && <LoadingState stage={ai.aiLoadingStage} />}

      {/* AI Error - Network or Server Error */}
      {ai.aiError && !hasFailedResult && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="space-y-3">
            <p className="text-sm">{ai.aiError}</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleGenerate}>
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
              {ai.aiResult.error_message || "Nie udało się wygenerować oszacowania."}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerate}
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
          result={ai.aiResult}
          onRegenerate={handleGenerate}
          onEditManually={onSwitchToManual}
          regenerateLoading={ai.aiLoading}
        />
      )}
    </div>
  );
}
