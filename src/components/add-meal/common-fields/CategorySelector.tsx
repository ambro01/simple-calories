/**
 * CategorySelector Component
 *
 * Visual button group for selecting meal category.
 * Displays category options with icons and supports toggle selection.
 *
 * @component
 * @example
 * <CategorySelector
 *   value="breakfast"
 *   onChange={(category) => setCategory(category)}
 * />
 */

import { Button } from "@/components/ui/button";
import type { CategorySelectorProps } from "../../../types/add-meal.types";
import type { MealCategory } from "../../../types";
import { CATEGORY_ICONS } from "../../../lib/constants/meal-form.constants";

const CATEGORIES: Array<{ value: MealCategory; label: string }> = [
  { value: "breakfast", label: "Śniadanie" },
  { value: "lunch", label: "Obiad" },
  { value: "dinner", label: "Kolacja" },
  { value: "snack", label: "Przekąska" },
  { value: "other", label: "Inne" },
];

export function CategorySelector({ value, onChange }: CategorySelectorProps) {
  const handleClick = (category: MealCategory) => {
    // Toggle: if clicking the selected category, deselect it
    if (value === category) {
      onChange(null);
    } else {
      onChange(category);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((category) => {
        const isSelected = value === category.value;
        const icon = CATEGORY_ICONS[category.value];

        return (
          <Button
            key={category.value}
            type="button"
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => handleClick(category.value)}
            className="gap-2"
          >
            <span className="text-base">{icon}</span>
            <span>{category.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
