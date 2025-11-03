/**
 * CommonFields Component
 *
 * Shared fields for both AI and Manual modes:
 * - Category selector (optional)
 * - Date picker (default: today)
 * - Date warning (conditional)
 * - Time picker (default: now)
 *
 * @component
 * @example
 * <CommonFields
 *   category={category}
 *   date={date}
 *   time={time}
 *   dateWarning={warning}
 *   onCategoryChange={(cat) => setCategory(cat)}
 *   onDateChange={(d) => setDate(d)}
 *   onTimeChange={(t) => setTime(t)}
 * />
 */

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle } from "lucide-react";
import type { CommonFieldsProps } from "../../../types/add-meal.types";
import { CategorySelector } from "./CategorySelector";

export function CommonFields({
  category,
  date,
  time,
  dateWarning,
  onCategoryChange,
  onDateChange,
  onTimeChange,
}: CommonFieldsProps) {
  const isFutureDate = dateWarning?.type === "future";
  const isOldDate = dateWarning?.type === "old";

  return (
    <div className="space-y-4">
      {/* Category Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Kategoria
          <span className="ml-1 text-xs text-muted-foreground">(opcjonalna)</span>
        </Label>
        <CategorySelector value={category} onChange={onCategoryChange} />
      </div>

      {/* Date Picker */}
      <div className="space-y-2">
        <Label htmlFor="meal-date" className="text-sm font-medium">
          Data
        </Label>
        <Input
          id="meal-date"
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className={isFutureDate ? "border-destructive" : ""}
        />

        {/* Date Warning - Future (Error) */}
        {isFutureDate && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{dateWarning.message}</AlertDescription>
          </Alert>
        )}

        {/* Date Warning - Old (Warning) */}
        {isOldDate && (
          <Alert variant="warning" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
            <AlertDescription className="text-sm text-yellow-800 dark:text-yellow-200">
              {dateWarning.message}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Time Picker */}
      <div className="space-y-2">
        <Label htmlFor="meal-time" className="text-sm font-medium">
          Godzina
        </Label>
        <Input id="meal-time" type="time" value={time} onChange={(e) => onTimeChange(e.target.value)} />
      </div>
    </div>
  );
}
