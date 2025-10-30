/**
 * LoadingState Component
 *
 * Multi-stage loading indicator for AI generation process.
 * Displays a spinner, progress dots, and stage-specific text.
 *
 * Stages:
 * 0: "Analizuję opis..."
 * 1: "Szacuję kalorie..."
 * 2: "Obliczam makroskładniki..."
 *
 * @component
 * @example
 * <LoadingState stage={1} />
 */

import type { LoadingStateProps } from '../../types/add-meal.types';
import { AI_LOADING_STAGES } from '../../lib/constants/meal-form.constants';

export function LoadingState({ stage }: LoadingStateProps) {
  const stageText = AI_LOADING_STAGES[stage];

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      {/* Spinner */}
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      </div>

      {/* Progress Dots */}
      <div className="flex gap-2">
        {[0, 1, 2].map((dotIndex) => (
          <div
            key={dotIndex}
            className={`h-2 w-2 rounded-full transition-all duration-300 ${
              dotIndex === stage
                ? 'bg-primary scale-125'
                : dotIndex < stage
                  ? 'bg-primary/60'
                  : 'bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>

      {/* Stage Text */}
      <p className="text-sm text-muted-foreground animate-pulse">{stageText}</p>
    </div>
  );
}
