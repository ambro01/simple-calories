/**
 * AddMealModal Component (Legacy - kept for backward compatibility)
 *
 * @deprecated Use MealModal instead
 * This is a wrapper component that forwards props to MealModal.
 * It exists only for backward compatibility with existing code.
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

import type { AddMealModalProps } from "../../types/add-meal.types";
import { MealModal } from "./MealModal";

/**
 * @deprecated Use MealModal instead
 */
export function AddMealModal(props: AddMealModalProps) {
  return <MealModal {...props} />;
}
