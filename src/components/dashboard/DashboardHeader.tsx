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
    <div className="bg-background border-b border-border sticky top-0 z-10">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">
            Kalendarz posiłków
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={onAddMeal}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-2"
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
            <a
              href="/settings"
              className="p-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg shadow-sm hover:shadow-md transition-all"
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
      </div>
    </div>
  );
}
