/**
 * DayDetails Component
 *
 * Główny kontener widoku szczegółów dnia.
 * Wyświetla nagłówek z podsumowaniem i listę posiłków.
 * Obsługuje dodawanie, edycję i usuwanie posiłków.
 */

import { useState } from "react";
import { useDayDetails } from "@/hooks/useDayDetails";
import { DayHeader } from "./DayHeader";
import { MealCard } from "./MealCard";
import { SkeletonMealCard } from "./SkeletonMealCard";
import { EmptyMealsList } from "./EmptyMealsList";
import { FAB } from "@/components/dashboard/FAB";
import { MealModal } from "@/components/add-meal";

interface DayDetailsProps {
  date: string; // YYYY-MM-DD
  onBack?: () => void;
}

export function DayDetails({ date, onBack }: DayDetailsProps) {
  const {
    state,
    deleteMeal,
    refreshAfterMealChange,
    setEditingMeal,
  } = useDayDetails({ date });

  const [isAddMealModalOpen, setIsAddMealModalOpen] = useState(false);
  const [isEditMealModalOpen, setIsEditMealModalOpen] = useState(false);

  // Error state
  if (state.error && !state.progress) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Wystąpił błąd
        </h2>
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
  if (state.loading && !state.progress) {
    return (
      <div className="min-h-screen">
        {/* Header skeleton */}
        <div className="bg-background border-b border-border p-4 animate-pulse">
          <div className="max-w-4xl mx-auto">
            <div className="h-8 bg-muted rounded w-64 mb-4" />
            <div className="bg-muted rounded-lg p-4 mb-4">
              <div className="h-8 bg-muted-foreground/20 rounded w-48 mb-2" />
              <div className="h-2.5 bg-muted-foreground/20 rounded w-full" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="h-16 bg-muted rounded" />
              <div className="h-16 bg-muted rounded" />
              <div className="h-16 bg-muted rounded" />
            </div>
          </div>
        </div>

        {/* Meals skeleton */}
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonMealCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Render with data
  if (!state.progress) return null;

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <DayHeader
          progress={state.progress}
          onBack={onBack}
          onAddMeal={() => setIsAddMealModalOpen(true)}
        />

        {/* Meals list */}
        <div className="max-w-4xl mx-auto p-4">
          {state.meals.length === 0 && !state.loading ? (
            <EmptyMealsList onAddMeal={() => setIsAddMealModalOpen(true)} />
          ) : (
            <div className="space-y-4">
              {state.meals.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  onEdit={(meal) => {
                    setEditingMeal(meal);
                    setIsEditMealModalOpen(true);
                  }}
                  onDelete={deleteMeal}
                  isDeleting={state.deletingMealId === meal.id}
                />
              ))}
            </div>
          )}

          {/* Loading more skeleton */}
          {state.loading && state.meals.length > 0 && (
            <div className="mt-4 space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <SkeletonMealCard key={i} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FAB for mobile */}
      <FAB onClick={() => setIsAddMealModalOpen(true)} />

      {/* Add meal modal */}
      <MealModal
        isOpen={isAddMealModalOpen}
        onClose={() => setIsAddMealModalOpen(false)}
        onSuccess={async () => {
          await refreshAfterMealChange();
          setIsAddMealModalOpen(false);
        }}
      />

      {/* Edit meal modal */}
      {state.editingMeal && (
        <MealModal
          isOpen={isEditMealModalOpen}
          mealId={state.editingMeal.id}
          onClose={() => {
            setIsEditMealModalOpen(false);
            setEditingMeal(null);
          }}
          onSuccess={async () => {
            await refreshAfterMealChange();
            setIsEditMealModalOpen(false);
            setEditingMeal(null);
          }}
        />
      )}
    </>
  );
}
