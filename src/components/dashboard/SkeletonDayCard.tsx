/**
 * SkeletonDayCard Component
 *
 * Skeleton loader dla DayCard - wyświetlany podczas ładowania danych.
 */

export function SkeletonDayCard() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
      {/* Date skeleton */}
      <div className="h-5 bg-gray-300 rounded w-32 mb-3" />

      {/* Calories info skeleton */}
      <div className="flex justify-between items-baseline mb-2">
        <div className="h-6 bg-gray-300 rounded w-24" />
        <div className="h-4 bg-gray-200 rounded w-20" />
      </div>

      {/* Progress bar skeleton */}
      <div className="h-2.5 bg-gray-200 rounded-full w-full mb-3" />

      {/* Macros skeleton */}
      <div className="flex gap-3">
        <div className="h-4 bg-gray-200 rounded w-16" />
        <div className="h-4 bg-gray-200 rounded w-16" />
        <div className="h-4 bg-gray-200 rounded w-16" />
      </div>
    </div>
  );
}
