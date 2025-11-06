/**
 * EmptyMealsList Component
 *
 * Empty state dla listy posiłków - wyświetlany gdy brak posiłków w danym dniu.
 */

type EmptyMealsListProps = {
  onAddMeal: () => void;
};

export function EmptyMealsList({ onAddMeal }: EmptyMealsListProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-6xl mb-4">🍽️</div>
      <h2 className="text-xl font-semibold text-foreground mb-2">Brak posiłków w tym dniu</h2>
      <p className="text-muted-foreground max-w-sm mb-6">
        Dodaj swój pierwszy posiłek, aby rozpocząć śledzenie kalorii.
      </p>
      <button
        onClick={onAddMeal}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        Dodaj posiłek
      </button>
    </div>
  );
}
