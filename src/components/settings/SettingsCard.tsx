/**
 * SettingsCard Component
 *
 * Reusable component representing a single settings option.
 * Displays a title, optional subtitle, icon, and chevron indicating clickability.
 */

import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { SettingsCardProps } from "@/types/settings.types";

export function SettingsCard({
  title,
  subtitle,
  icon,
  onClick,
  variant = "default",
  showChevron = !!onClick,
}: SettingsCardProps) {
  const isClickable = !!onClick;

  // Determine card styles based on variant
  const cardClasses = `
    transition-colors
    ${isClickable ? "cursor-pointer hover:bg-accent" : ""}
    ${variant === "destructive" ? "border-destructive/50" : ""}
  `.trim();

  // Determine text color based on variant
  const titleClasses = `
    font-medium
    ${variant === "destructive" ? "text-destructive" : "text-foreground"}
  `.trim();

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Card
      className={cardClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={isClickable ? title : undefined}
    >
      <CardContent className="flex items-center gap-3 p-4">
        {/* Icon */}
        {icon && (
          <div
            className={`flex-shrink-0 ${variant === "destructive" ? "text-destructive" : "text-muted-foreground"}`}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}

        {/* Title and Subtitle */}
        <div className="flex-1 min-w-0">
          <h3 className={titleClasses}>{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>

        {/* Chevron */}
        {showChevron && (
          <ChevronRight
            className={`flex-shrink-0 h-5 w-5 ${variant === "destructive" ? "text-destructive" : "text-muted-foreground"}`}
            aria-hidden="true"
          />
        )}
      </CardContent>
    </Card>
  );
}
