/**
 * Date Helper Functions
 *
 * Utility functions for date validation and manipulation used across the API.
 */

/**
 * Validates if a string matches the YYYY-MM-DD format and represents a valid date
 *
 * @param date - Date string to validate
 * @returns true if the date is in valid YYYY-MM-DD format, false otherwise
 *
 * @example
 * isValidDateFormat("2025-01-27") // true
 * isValidDateFormat("2025-13-01") // false (invalid month)
 * isValidDateFormat("2025-01-32") // false (invalid day)
 * isValidDateFormat("25-01-27") // false (wrong format)
 */
export function isValidDateFormat(date: string): boolean {
  // Check format with regex
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return false;
  }

  // Parse and validate the date
  const parsedDate = new Date(date);

  // Check if date is valid (not NaN) and matches the input
  if (isNaN(parsedDate.getTime())) {
    return false;
  }

  // Verify that the parsed date matches the input string
  // This catches cases like "2025-02-30" which JavaScript would parse as "2025-03-02"
  const [year, month, day] = date.split("-").map(Number);
  return (
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() === month - 1 && // getMonth() is 0-indexed
    parsedDate.getDate() === day
  );
}

/**
 * Checks if a date string (YYYY-MM-DD) represents a future date
 *
 * @param date - Date string in YYYY-MM-DD format
 * @returns true if the date is in the future, false otherwise
 *
 * @example
 * // Assuming today is 2025-01-27
 * isDateInFuture("2025-01-28") // true
 * isDateInFuture("2025-01-27") // false (today)
 * isDateInFuture("2025-01-26") // false (past)
 */
export function isDateInFuture(date: string): boolean {
  const requestDate = new Date(date);
  const today = new Date();

  // Reset time to midnight for accurate date-only comparison
  today.setHours(0, 0, 0, 0);
  requestDate.setHours(0, 0, 0, 0);

  return requestDate > today;
}

/**
 * Compares two date strings to check if the first is less than or equal to the second
 *
 * @param dateFrom - Start date in YYYY-MM-DD format
 * @param dateTo - End date in YYYY-MM-DD format
 * @returns true if dateFrom <= dateTo, false otherwise
 *
 * @example
 * isDateRangeValid("2025-01-01", "2025-01-31") // true
 * isDateRangeValid("2025-01-31", "2025-01-01") // false
 */
export function isDateRangeValid(dateFrom: string, dateTo: string): boolean {
  const from = new Date(dateFrom);
  const to = new Date(dateTo);

  return from <= to;
}
