/**
 * EmptyDashboard Component
 *
 * Empty state dla Dashboard - wyświetlany gdy brak dni do wyświetlenia.
 * Przycisk do dodawania posiłków jest przekazywany jako props.
 */

interface EmptyDashboardProps {
  onAddMeal?: () => void;
}

export function EmptyDashboard({ onAddMeal }: EmptyDashboardProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-6xl mb-4">📊</div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Brak danych do wyświetlenia
      </h2>
      <p className="text-gray-600 max-w-sm mb-6">
        Dodaj swój pierwszy posiłek, aby rozpocząć śledzenie kalorii.
      </p>
      {onAddMeal && (
        <button
          onClick={onAddMeal}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
        >
          Dodaj pierwszy posiłek
        </button>
      )}
    </div>
  );
}
