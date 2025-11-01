/**
 * useDateFormatter Hook
 *
 * Hook dostarczający instancję date formatter.
 * Używa useMemo dla optymalizacji.
 */

import { useMemo } from "react";
import { createDateFormatter, type DateFormatter } from "@/lib/helpers/date-formatter";

export function useDateFormatter(): DateFormatter {
  return useMemo(() => createDateFormatter(), []);
}
