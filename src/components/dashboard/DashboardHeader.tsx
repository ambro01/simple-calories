/**
 * DashboardHeader Component
 *
 * Nagłówek widoku Dashboard.
 * Wyświetla tytuł i przycisk do dodawania posiłków.
 */

interface DashboardHeaderProps {
  onAddMeal: () => void;
}

export function DashboardHeader({ onAddMeal }: DashboardHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Kalendarz posiłków
          </h1>
          <button
            onClick={onAddMeal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-2"
            aria-label="Dodaj posiłek"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="hidden sm:inline">Dodaj posiłek</span>
          </button>
        </div>
      </div>
    </div>
  );
}
