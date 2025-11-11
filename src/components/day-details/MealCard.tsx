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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
      {/* Header: category badge + AI badge + time + actions menu */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryConfig.color}`}
          >
            <span>{categoryConfig.icon}</span>
            <span>{categoryConfig.label}</span>
          </span>
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
              <span className="hidden sm:inline">Wygenerowane przez AI</span>
            </span>
          )}
          <span className="text-sm text-muted-foreground ml-auto" data-testid="meal-card-time">
            {mealTime}
          </span>
        </div>

        {/* Actions menu - three dots (mobile only) */}
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={isDeleting}
            className="lg:hidden ml-2 p-1.5 hover:bg-accent rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Menu akcji"
            data-testid="meal-card-actions-menu"
          >
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={() => onEdit(meal)}
              className="cursor-pointer"
              data-testid="meal-card-edit-button-mobile"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edytuj
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDeleteClick}
              className="cursor-pointer text-destructive focus:text-destructive"
              data-testid="meal-card-delete-button-mobile"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Usuń
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Description line */}
      <p className="text-foreground font-medium mb-2" data-testid="meal-card-description">
        {meal.description}
      </p>

      {/* Calories and macros line */}
      {!showDeleteConfirm ? (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-lg font-bold text-foreground whitespace-nowrap" data-testid="meal-card-calories">
            {meal.calories} kcal
          </div>
          {(meal.protein !== null || meal.carbs !== null || meal.fats !== null) && (
            <div className="flex gap-2 text-xs text-muted-foreground whitespace-nowrap flex-wrap">
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

          {/* Action buttons (desktop only) */}
          <div className="hidden lg:flex gap-2 ml-auto">
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
