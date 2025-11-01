/**
 * SkeletonMealCard Component
 *
 * Skeleton loader dla MealCard - wyświetlany podczas ładowania posiłków.
 */

export function SkeletonMealCard() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
      {/* Header: category badge + time */}
      <div className="flex justify-between items-center mb-3">
        <div className="h-5 bg-gray-300 rounded w-24" />
        <div className="h-4 bg-gray-200 rounded w-16" />
      </div>

      {/* Description */}
      <div className="h-5 bg-gray-300 rounded w-full mb-2" />
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />

      {/* Calories */}
      <div className="h-6 bg-gray-300 rounded w-32 mb-3" />

      {/* Macros */}
      <div className="flex gap-3 mb-3">
        <div className="h-4 bg-gray-200 rounded w-16" />
        <div className="h-4 bg-gray-200 rounded w-16" />
        <div className="h-4 bg-gray-200 rounded w-16" />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <div className="h-8 bg-gray-200 rounded w-20" />
        <div className="h-8 bg-gray-200 rounded w-20" />
      </div>
    </div>
  );
}
