/**
 * Dashboard Component
 *
 * Główny kontener widoku Dashboard.
 * Wyświetla listę dni z infinite scroll, FAB do dodawania posiłków.
 * Obsługuje stany: loading, error, empty.
 */

import { useState } from "react";
import { useDashboard } from "@/hooks/useDashboard";
import { DayCard } from "./DayCard";
import { SkeletonDayCard } from "./SkeletonDayCard";
import { EmptyDashboard } from "./EmptyDashboard";
import { DashboardHeader } from "./DashboardHeader";
import { FAB } from "./FAB";
import { InfiniteScrollTrigger } from "@/components/shared/InfiniteScrollTrigger";
import { MealModal } from "@/components/add-meal";

export function Dashboard() {
  const { state, loadMoreDays, selectDay, refetchAfterMealChange } = useDashboard();
  const [isAddMealModalOpen, setIsAddMealModalOpen] = useState(false);

  console.log("🎨 [Dashboard] Render", {
    daysLength: state.days.length,
    isRefetchingAfterChange: state.isRefetchingAfterChange,
    loading: state.loading,
  });

  // Error state
  if (state.error && state.days.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Wystąpił błąd</h2>
        <p className="text-muted-foreground max-w-sm mb-4">{state.error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Odśwież stronę
        </button>
      </div>
    );
  }

  // Loading initial state
  if (state.loading && state.days.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonDayCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Empty state - ale nie pokazuj pustego stanu podczas refetch po dodaniu posiłku
  if (state.days.length === 0 && !state.isRefetchingAfterChange) {
    return (
      <>
        <EmptyDashboard onAddMeal={() => setIsAddMealModalOpen(true)} />
        <FAB onClick={() => setIsAddMealModalOpen(true)} />
        <MealModal
          isOpen={isAddMealModalOpen}
          onClose={() => setIsAddMealModalOpen(false)}
          onSuccess={async () => {
            console.log("🎯 [Dashboard EMPTY] MealModal onSuccess - calling refetchAfterMealChange");
            await refetchAfterMealChange();
            console.log("🎯 [Dashboard EMPTY] MealModal onSuccess - refetch completed, closing modal");
            setIsAddMealModalOpen(false);
          }}
        />
      </>
    );
  }

  // Refetching after meal change with empty days - show loading skeleton
  if (state.days.length === 0 && state.isRefetchingAfterChange) {
    return (
      <>
        <DashboardHeader onAddMeal={() => setIsAddMealModalOpen(true)} />
        <div className="max-w-4xl mx-auto p-4">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonDayCard key={i} />
            ))}
          </div>
        </div>
        <FAB onClick={() => setIsAddMealModalOpen(true)} />
        <MealModal
          isOpen={isAddMealModalOpen}
          onClose={() => setIsAddMealModalOpen(false)}
          onSuccess={async () => {
            console.log("🎯 [Dashboard REFETCH] MealModal onSuccess - calling refetchAfterMealChange");
            await refetchAfterMealChange();
            console.log("🎯 [Dashboard REFETCH] MealModal onSuccess - refetch completed, closing modal");
            setIsAddMealModalOpen(false);
          }}
        />
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <DashboardHeader onAddMeal={() => setIsAddMealModalOpen(true)} />

      <div className="max-w-4xl mx-auto p-4">
        {/* Days grid */}
        <div className="space-y-4">
          {state.days.map((day) => (
            <DayCard
              key={day.date}
              day={day}
              onClick={() => {
                // Na mobile: nawigacja do /day/:date
                // Na desktop: selectDay dla two-pane (w przyszłości)
                window.location.href = `/day/${day.date}`;
              }}
              isSelected={state.selectedDate === day.date}
            />
          ))}
        </div>

        {/* Loading more skeleton */}
        {state.loading && (
          <div className="mt-4 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonDayCard key={i} />
            ))}
          </div>
        )}

        {/* Infinite scroll trigger */}
        <InfiniteScrollTrigger onIntersect={loadMoreDays} hasMore={state.hasMore} loading={state.loading} />

        {/* End of list message */}
        {!state.hasMore && state.days.length > 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">Koniec listy</div>
        )}
      </div>

      {/* FAB for mobile */}
      <FAB onClick={() => setIsAddMealModalOpen(true)} />

      {/* Add meal modal */}
      <MealModal
        isOpen={isAddMealModalOpen}
        onClose={() => setIsAddMealModalOpen(false)}
        onSuccess={async () => {
          console.log("🎯 [Dashboard MAIN] MealModal onSuccess - calling refetchAfterMealChange");
          await refetchAfterMealChange();
          console.log("🎯 [Dashboard MAIN] MealModal onSuccess - refetch completed, closing modal");
          setIsAddMealModalOpen(false);
        }}
      />
    </>
  );
}
