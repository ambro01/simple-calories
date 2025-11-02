/**
 * DayCard Component
 *
 * Komponent karty pojedynczego dnia w Dashboard.
 * Wyświetla podsumowanie kalorii, makroskładników i progress bar.
 */

import type { DailyProgressResponseDTO } from "@/types";
import { CalorieProgressBar } from "@/components/shared/CalorieProgressBar";
import { useDateFormatter } from "@/hooks/useDateFormatter";

interface DayCardProps {
  day: DailyProgressResponseDTO;
  onClick?: () => void;
  isSelected?: boolean;
}

export function DayCard({ day, onClick, isSelected = false }: DayCardProps) {
  const dateFormatter = useDateFormatter();

  // Format daty
  const formattedDate = dateFormatter.format(day.date, "full");

  return (
    <button
      onClick={onClick}
      className={`
        w-full bg-card rounded-lg shadow-sm border border-border p-4
        text-left transition-all hover:shadow-md hover:border-accent
        ${isSelected ? "ring-2 ring-primary border-primary" : ""}
      `}
      aria-label={`Pokaż szczegóły dla ${formattedDate}`}
    >
      {/* Date */}
      <div className="text-sm font-medium text-foreground mb-3">{formattedDate}</div>

      {/* Calories info */}
      <div className="flex justify-between items-baseline mb-2">
        <div className="text-lg font-semibold text-foreground">
          {day.total_calories} / {day.calorie_goal} kcal
        </div>
        <div className="text-sm text-muted-foreground">{day.percentage.toFixed(0)}%</div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <CalorieProgressBar percentage={day.percentage} status={day.status} size="md" />
      </div>

      {/* Macros */}
      <div className="flex gap-3 text-xs text-muted-foreground">
        <div>
          <span className="font-medium">Białko:</span> {day.total_protein}g
        </div>
        <div>
          <span className="font-medium">Węglowodany:</span> {day.total_carbs}g
        </div>
        <div>
          <span className="font-medium">Tłuszcze:</span> {day.total_fats}g
        </div>
      </div>
    </button>
  );
}
