/**
 * AIResult Component
 *
 * Displays the result of AI meal generation including:
 * - Large calorie display
 * - Macronutrients grid (2x2)
 * - AI assumptions text
 * - Action buttons (Accept, Regenerate, Edit Manually)
 *
 * @component
 * @example
 * <AIResult
 *   result={aiGenerationData}
 *   onAccept={() => handleAccept()}
 *   onRegenerate={async () => await handleRegenerate()}
 *   onEditManually={() => switchToManual()}
 *   regenerateLoading={false}
 * />
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { AIResultProps } from "../../../types/add-meal.types";

export function AIResult({ result, onAccept, onRegenerate, onEditManually, regenerateLoading = false }: AIResultProps) {
  const macros = [
    { label: "Białko", value: result.generated_protein, unit: "g" },
    { label: "Węglowodany", value: result.generated_carbs, unit: "g" },
    { label: "Tłuszcze", value: result.generated_fats, unit: "g" },
  ];

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="space-y-6 pt-6">
        {/* Calories Display */}
        <div className="text-center">
          <div className="text-5xl font-bold text-primary">{result.generated_calories ?? "—"}</div>
          <div className="mt-1 text-sm text-muted-foreground">kcal</div>
        </div>

        {/* Macronutrients Grid */}
        <div className="grid grid-cols-3 gap-4">
          {macros.map((macro) => (
            <div key={macro.label} className="text-center">
              <div className="text-2xl font-semibold">
                {macro.value !== null && macro.value !== undefined ? macro.value : "—"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {macro.label}
                <span className="ml-0.5">{macro.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Assumptions */}
        {result.assumptions && (
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-xs italic text-muted-foreground">{result.assumptions}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" onClick={onAccept} className="flex-1">
            Dodaj
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onRegenerate}
            disabled={regenerateLoading}
            className="flex-1"
          >
            {regenerateLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generuj ponownie
          </Button>
          <Button type="button" variant="ghost" onClick={onEditManually} className="flex-1">
            Edytuj ręcznie
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
