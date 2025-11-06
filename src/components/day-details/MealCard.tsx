/**
 * MealCard Component
 *
 * Komponent karty pojedynczego posiłku.
 * Wyświetla szczegóły posiłku, przyciski edycji i usuwania.
 * Obsługuje delete confirmation z auto-collapse.
 */

import { useState, useEffect, useRef } from "react";
import type { MealResponseDTO } from "@/types";
import { CATEGORY_CONFIG } from "@/types/day-details.types";
import { useDateFormatter } from "@/hooks/useDateFormatter";

type MealCardProps = {
  meal: MealResponseDTO;
  onEdit: (meal: MealResponseDTO) => void;
  onDelete: (mealId: string) => void;
  isDeleting?: boolean;
};

export function MealCard({ meal, onEdit, onDelete, isDeleting = false }: MealCardProps) {
  const dateFormatter = useDateFormatter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Category config
  const categoryConfig = meal.category ? CATEGORY_CONFIG[meal.category] : CATEGORY_CONFIG.other;

  // Format time
  const mealTime = dateFormatter.format(meal.meal_timestamp, "time");

  // Auto-collapse delete confirmation po 5s
  useEffect(() => {
    if (showDeleteConfirm) {
      deleteTimerRef.current = setTimeout(() => {
        setShowDeleteConfirm(false);
      }, 5000);
    }

    return () => {
      if (deleteTimerRef.current) {
        clearTimeout(deleteTimerRef.current);
      }
    };
  }, [showDeleteConfirm]);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
    }
    setShowDeleteConfirm(false);
    onDelete(meal.id);
  };

  const handleDeleteCancel = () => {
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
    }
    setShowDeleteConfirm(false);
  };

  return (
    <div
      className={`bg-card rounded-lg shadow-sm border border-border p-3 transition-opacity ${
        isDeleting ? "opacity-50 pointer-events-none" : ""
      }`}
      data-testid="meal-card"
      data-meal-id={meal.id}
    >
      {/* Header: category badge + AI badge + time */}
      <div className="flex justify-between items-center mb-2">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryConfig.color}`}
        >
          <span>{categoryConfig.icon}</span>
          <span>{categoryConfig.label}</span>
        </span>
        <div className="flex items-center gap-2">
          {meal.input_method === "ai" && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 7H7v6h6V7z" />
                <path
                  fillRule="evenodd"
                  d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z"
                  clipRule="evenodd"
                />
              </svg>
              Wygenerowane przez AI
            </span>
          )}
          <span className="text-sm text-muted-foreground" data-testid="meal-card-time">
            {mealTime}
          </span>
        </div>
      </div>

      {/* Description line */}
      <p className="text-foreground font-medium mb-2" data-testid="meal-card-description">
        {meal.description}
      </p>

      {/* Calories, macros & actions line */}
      {!showDeleteConfirm ? (
        <div className="flex items-center gap-3">
          <div className="text-lg font-bold text-foreground whitespace-nowrap" data-testid="meal-card-calories">
            {meal.calories} kcal
          </div>
          {(meal.protein !== null || meal.carbs !== null || meal.fats !== null) && (
            <div className="flex gap-2 text-xs text-muted-foreground whitespace-nowrap">
              {meal.protein !== null && (
                <span>
                  <span className="font-medium">Białko:</span> {meal.protein}g
                </span>
              )}
              {meal.carbs !== null && (
                <span>
                  <span className="font-medium">Węglowodany:</span> {meal.carbs}g
                </span>
              )}
              {meal.fats !== null && (
                <span>
                  <span className="font-medium">Tłuszcze:</span> {meal.fats}g
                </span>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => onEdit(meal)}
              disabled={isDeleting}
              className="px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Edytuj posiłek"
              data-testid="meal-card-edit-button"
            >
              Edytuj
            </button>
            <button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Usuń posiłek"
              data-testid="meal-card-delete-button"
            >
              Usuń
            </button>
          </div>
        </div>
      ) : (
        <div
          className="bg-destructive/10 border border-destructive/20 rounded-md p-3"
          data-testid="delete-confirm-dialog"
        >
          <p className="text-sm text-destructive mb-2">Czy na pewno chcesz usunąć ten posiłek?</p>
          <div className="flex gap-2">
            <button
              onClick={handleDeleteConfirm}
              className="px-3 py-1.5 text-sm font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-md transition-colors"
              aria-label="Potwierdź usunięcie"
              data-testid="confirm-delete-button"
            >
              Usuń
            </button>
            <button
              onClick={handleDeleteCancel}
              className="px-3 py-1.5 text-sm font-medium text-foreground bg-secondary border border-border hover:bg-secondary/80 rounded-md transition-colors"
              aria-label="Anuluj usunięcie"
              data-testid="cancel-delete-button"
            >
              Anuluj
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
