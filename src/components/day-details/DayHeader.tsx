/**
 * DayHeader Component
 *
 * Nagłówek widoku DayDetails.
 * Wyświetla datę, podsumowanie kalorii, progress bar i makroskładniki.
 */

import type { DailyProgressResponseDTO } from "@/types";
import { CalorieProgressBar } from "@/components/shared/CalorieProgressBar";
import { useDateFormatter } from "@/hooks/useDateFormatter";

interface DayHeaderProps {
  progress: DailyProgressResponseDTO;
  onBack?: () => void;
  onAddMeal?: () => void;
}

export function DayHeader({ progress, onBack, onAddMeal }: DayHeaderProps) {
  const dateFormatter = useDateFormatter();

  // Format daty
  const formattedDate = dateFormatter.format(progress.date, "full");

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto p-4">
        {/* Date and action buttons */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{formattedDate}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={onBack || (() => (window.location.href = "/"))}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-2"
              aria-label="Powrót do dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Powrót</span>
            </button>
            {onAddMeal && (
              <button
                onClick={onAddMeal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                aria-label="Dodaj posiłek"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Dodaj posiłek</span>
              </button>
            )}
            <a
              href="/settings"
              className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all"
              aria-label="Ustawienia"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </a>
          </div>
        </div>

        {/* Calories and Macros summary in one row */}
        <div className="flex gap-3">
          {/* Calories summary - 1/3 width */}
          <div className="flex-1 bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between items-baseline mb-2">
              <div className="text-lg font-bold text-gray-900">
                {progress.total_calories} / {progress.calorie_goal} kcal
              </div>
              <div className="text-sm text-gray-600">{progress.percentage.toFixed(0)}%</div>
            </div>
            <CalorieProgressBar percentage={progress.percentage} status={progress.status} size="sm" />
          </div>

          {/* Macros summary - 2/3 width */}
          <div className="flex-[2] grid grid-cols-3 gap-2">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-600 mb-1">Białko</div>
              <div className="text-lg font-semibold text-gray-900">{progress.total_protein}g</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-600 mb-1">Węglowodany</div>
              <div className="text-lg font-semibold text-gray-900">{progress.total_carbs}g</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-600 mb-1">Tłuszcze</div>
              <div className="text-lg font-semibold text-gray-900">{progress.total_fats}g</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
