/**
 * CalorieProgressBar Component
 *
 * Komponent progress bar z kolorowaniem według statusu realizacji celu.
 * Używany zarówno w Dashboard jak i DayDetails.
 */

import { getStatusBgClass } from "@/lib/helpers/status-colors";
import type { DailyProgressStatus } from "@/types";

interface CalorieProgressBarProps {
  percentage: number;
  status: DailyProgressStatus;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function CalorieProgressBar({
  percentage,
  status,
  showLabel = false,
  size = "md",
}: CalorieProgressBarProps) {
  // Ograniczenie do 0-100% dla UI (może być > 100 w danych)
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  const statusBgClass = getStatusBgClass(status);

  // Wysokości dla różnych rozmiarów
  const heightClass = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  }[size];

  return (
    <div className="w-full">
      <div className={`w-full bg-muted rounded-full overflow-hidden ${heightClass}`}>
        <div
          className={`${statusBgClass} h-full rounded-full transition-all duration-300 ease-in-out`}
          style={{ width: `${clampedPercentage}%` }}
          role="progressbar"
          aria-valuenow={clampedPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Postęp realizacji celu kalorycznego"
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-xs text-muted-foreground text-right">
          {percentage.toFixed(0)}%
        </div>
      )}
    </div>
  );
}
