/**
 * EmptyMealsList Component
 *
 * Empty state dla listy posiłków - wyświetlany gdy brak posiłków w danym dniu.
 */

interface EmptyMealsListProps {
  onAddMeal: () => void;
}

export function EmptyMealsList({ onAddMeal }: EmptyMealsListProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-6xl mb-4">🍽️</div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Brak posiłków w tym dniu
      </h2>
      <p className="text-gray-600 max-w-sm mb-6">
        Dodaj swój pierwszy posiłek, aby rozpocząć śledzenie kalorii.
      </p>
      <button
        onClick={onAddMeal}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Dodaj posiłek
      </button>
    </div>
  );
}
