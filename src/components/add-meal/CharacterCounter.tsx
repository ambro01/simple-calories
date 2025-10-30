/**
 * CharacterCounter Component
 *
 * Displays a character count indicator with dynamic color based on usage percentage.
 * Used in textarea inputs to show remaining characters.
 *
 * @component
 * @example
 * <CharacterCounter current={245} max={500} />
 */

import type { CharacterCounterProps } from '../../types/add-meal.types';

export function CharacterCounter({ current, max }: CharacterCounterProps) {
  const percent = (current / max) * 100;

  // Color changes based on usage
  const colorClass =
    percent >= 98
      ? 'text-destructive' // Red when at limit
      : percent >= 90
        ? 'text-yellow-600 dark:text-yellow-500' // Yellow when nearing limit
        : 'text-muted-foreground'; // Gray by default

  return (
    <span className={`text-xs ${colorClass} transition-colors duration-200`}>
      {current}/{max}
    </span>
  );
}
