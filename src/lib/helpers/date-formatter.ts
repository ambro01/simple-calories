/**
 * Date Formatting Utilities
 *
 * This file provides utilities for formatting dates in various formats
 * used throughout the application.
 */

/**
 * Formaty dat używane w aplikacji
 */
export type DateFormat =
  | "YYYY-MM-DD" // 2025-01-27 (API format)
  | "full" // Poniedziałek, 30 października 2025
  | "short" // Pn, 30 paź
  | "time"; // 08:30

/**
 * Helper do formatowania dat
 */
export type DateFormatter = {
  format(date: string | Date, format: DateFormat): string;
  parseAPIDate(date: string): Date;
  toAPIFormat(date: Date): string;
};

/**
 * Tworzy nowy formatter dat
 */
export function createDateFormatter(): DateFormatter {
  return {
    format(date: string | Date, format: DateFormat): string {
      const d = typeof date === "string" ? new Date(date) : date;

      switch (format) {
        case "YYYY-MM-DD":
          return d.toISOString().split("T")[0];
        case "full":
          return new Intl.DateTimeFormat("pl-PL", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          }).format(d);
        case "short":
          return new Intl.DateTimeFormat("pl-PL", {
            weekday: "short",
            day: "numeric",
            month: "short",
          }).format(d);
        case "time":
          return new Intl.DateTimeFormat("pl-PL", {
            hour: "2-digit",
            minute: "2-digit",
          }).format(d);
        default:
          return d.toISOString();
      }
    },
    parseAPIDate(date: string): Date {
      return new Date(date);
    },
    toAPIFormat(date: Date): string {
      return date.toISOString().split("T")[0];
    },
  };
}
