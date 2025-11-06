/**
 * SegmentedControl Component
 *
 * A toggle control that allows switching between AI and Manual modes.
 * Features a sliding indicator that animates between the selected option.
 *
 * @component
 * @example
 * <SegmentedControl
 *   value="ai"
 *   onChange={(mode) => setMode(mode)}
 *   disabled={false}
 * />
 */

import type { SegmentedControlProps } from "../../types/add-meal.types";

export function SegmentedControl({ value, onChange, disabled }: SegmentedControlProps) {
  const options = [
    { value: "ai" as const, label: "AI" },
    { value: "manual" as const, label: "Ręcznie" },
  ];

  return (
    <div
      className="inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground"
      data-testid="mode-selector"
    >
      {options.map((option) => {
        const isSelected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            data-testid={`mode-${option.value}`}
            className={`
              relative inline-flex items-center justify-center whitespace-nowrap
              rounded-md px-6 py-1.5 text-sm font-medium
              ring-offset-background transition-all
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-ring focus-visible:ring-offset-2
              disabled:pointer-events-none disabled:opacity-50
              ${isSelected ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50 hover:text-foreground"}
            `}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
