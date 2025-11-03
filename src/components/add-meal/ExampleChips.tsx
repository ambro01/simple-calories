/**
 * ExampleChips Component
 *
 * Displays a set of clickable example chips that can be used to
 * quickly fill in the meal description textarea with predefined examples.
 *
 * @component
 * @example
 * <ExampleChips
 *   examples={["Kanapka z szynką", "Kurczak z ryżem"]}
 *   onSelect={(example) => setPrompt(example)}
 *   disabled={false}
 * />
 */

import { Button } from "@/components/ui/button";
import type { ExampleChipsProps } from "../../types/add-meal.types";

export function ExampleChips({ examples, onSelect, disabled }: ExampleChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {examples.map((example, index) => (
        <Button
          key={index}
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onSelect(example)}
          className="text-xs"
        >
          {example}
        </Button>
      ))}
    </div>
  );
}
