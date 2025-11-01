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
        w-full bg-white rounded-lg shadow-sm border border-gray-200 p-4
        text-left transition-all hover:shadow-md hover:border-gray-300
        ${isSelected ? "ring-2 ring-blue-500 border-blue-500" : ""}
      `}
      aria-label={`Pokaż szczegóły dla ${formattedDate}`}
    >
      {/* Date */}
      <div className="text-sm font-medium text-gray-900 mb-3">{formattedDate}</div>

      {/* Calories info */}
      <div className="flex justify-between items-baseline mb-2">
        <div className="text-lg font-semibold text-gray-900">
          {day.total_calories} / {day.calorie_goal} kcal
        </div>
        <div className="text-sm text-gray-600">{day.percentage.toFixed(0)}%</div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <CalorieProgressBar percentage={day.percentage} status={day.status} size="md" />
      </div>

      {/* Macros */}
      <div className="flex gap-3 text-xs text-gray-600">
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
