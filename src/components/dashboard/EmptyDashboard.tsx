/**
 * EmptyDashboard Component
 *
 * Empty state dla Dashboard - wyświetlany gdy brak dni do wyświetlenia.
 * Przycisk do dodawania posiłków jest przekazywany jako props.
 */

import { DashboardHeader } from "./DashboardHeader";

type EmptyDashboardProps = {
  onAddMeal: () => void;
};

export function EmptyDashboard({ onAddMeal }: EmptyDashboardProps) {
  return (
    <>
      <DashboardHeader onAddMeal={onAddMeal} />
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Brak danych do wyświetlenia</h2>
        <p className="text-muted-foreground max-w-sm mb-6">
          Dodaj swój pierwszy posiłek, aby rozpocząć śledzenie kalorii.
        </p>
        <button
          onClick={onAddMeal}
          className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
        >
          Dodaj pierwszy posiłek
        </button>
      </div>
    </>
  );
}
