/**
 * MacroInputs Component
 *
 * A group of 4 input fields for entering macronutrient values:
 * - Protein (Białko)
 * - Carbs (Węglowodany)
 * - Fats (Tłuszcze)
 * - Fiber (Błonnik)
 *
 * All fields are optional and support decimal values (up to 2 decimal places).
 *
 * @component
 * @example
 * <MacroInputs
 *   protein={25.5}
 *   carbs={50}
 *   fats={15.2}
 *   fiber={8}
 *   onChange={(field, value) => updateField(field, value)}
 *   errors={{ protein: "Wartość za wysoka" }}
 * />
 */

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { MacroInputsProps } from "../../../types/add-meal.types";

const MACRO_FIELDS = [
  { key: "protein" as const, label: "Białko", unit: "g" },
  { key: "carbs" as const, label: "Węglowodany", unit: "g" },
  { key: "fats" as const, label: "Tłuszcze", unit: "g" },
  { key: "fiber" as const, label: "Błonnik", unit: "g" },
];

export function MacroInputs({ protein, carbs, fats, fiber, onChange, errors }: MacroInputsProps) {
  const values = { protein, carbs, fats, fiber };

  const handleChange = (field: "protein" | "carbs" | "fats" | "fiber", rawValue: string) => {
    // Handle empty input
    if (rawValue === "") {
      onChange(field, null);
      return;
    }

    // Parse as number
    const numValue = parseFloat(rawValue);

    // Validate number
    if (isNaN(numValue)) {
      return; // Don't update if invalid
    }

    onChange(field, numValue);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {MACRO_FIELDS.map((field) => {
        const value = values[field.key];
        const error = errors?.[field.key];
        const hasError = !!error;

        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key} className="text-sm font-medium">
              {field.label}
              <span className="ml-1 text-xs text-muted-foreground">(opcjonalne)</span>
            </Label>
            <div className="relative">
              <Input
                id={field.key}
                type="number"
                step="0.01"
                min="0"
                max="1000"
                value={value ?? ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder="0"
                className={hasError ? "border-destructive" : ""}
                data-testid={`manual-${field.key}-input`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {field.unit}
              </span>
            </div>
            {hasError && <p className="text-xs text-destructive">{error}</p>}
          </div>
        );
      })}
    </div>
  );
}
