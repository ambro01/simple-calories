/**
 * LoadingOverlay Component
 *
 * Overlay with spinner displayed while loading meal data for editing.
 * Covers the entire form with a backdrop blur effect.
 *
 * @component
 * @example
 * {form.state.loadingMeal && <LoadingOverlay />}
 */

import { Loader2 } from "lucide-react";

export function LoadingOverlay() {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Wczytuję dane posiłku...</p>
      </div>
    </div>
  );
}
