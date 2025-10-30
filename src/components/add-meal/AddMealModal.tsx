/**
 * AddMealModal Component
 *
 * Modal container for the AddMeal form.
 * Provides overlay, focus trap, escape handling, and responsiveness.
 * Fullscreen on mobile, dialog on desktop.
 *
 * @component
 * @example
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <AddMealModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSuccess={(meal) => {
 *     refreshMealsList();
 *     toast.success('Posiłek dodany');
 *     setIsOpen(false);
 *   }}
 * />
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AddMealModalProps } from "../../types/add-meal.types";
import { MealForm } from "./MealForm.tsx";

export function AddMealModal({ isOpen, onClose, onSuccess }: AddMealModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dodaj posiłek</DialogTitle>
        </DialogHeader>
        <MealForm onClose={onClose} onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>
  );
}
