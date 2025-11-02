/**
 * MealModal Component
 *
 * Universal modal for adding or editing meals.
 * Supports both create and edit modes based on the presence of mealId prop.
 * Provides overlay, focus trap, escape handling, and responsiveness.
 * Fullscreen on mobile, dialog on desktop.
 *
 * @component
 * @example
 * // Create mode
 * <MealModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSuccess={(meal) => {
 *     refreshMealsList();
 *     toast.success('Posiłek dodany');
 *     setIsOpen(false);
 *   }}
 * />
 *
 * @example
 * // Edit mode
 * <MealModal
 *   isOpen={isOpen}
 *   mealId="meal-123"
 *   onClose={() => setIsOpen(false)}
 *   onSuccess={(meal) => {
 *     refreshMealsList();
 *     toast.success('Posiłek zaktualizowany');
 *     setIsOpen(false);
 *   }}
 * />
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { AddMealModalProps } from "../../types/add-meal.types";
import { MealForm } from "./MealForm";

export function MealModal({ isOpen, onClose, onSuccess, mealId }: AddMealModalProps) {
  const isEditMode = Boolean(mealId);
  const title = isEditMode ? 'Edytuj posiłek' : 'Dodaj posiłek';
  const description = isEditMode
    ? 'Wprowadź zmiany w danych posiłku'
    : 'Użyj AI aby wygenerować wartości odżywcze lub wprowadź je ręcznie';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <MealForm onClose={onClose} onSuccess={onSuccess} mealId={mealId} />
      </DialogContent>
    </Dialog>
  );
}
