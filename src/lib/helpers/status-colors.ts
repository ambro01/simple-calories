/**
 * Status Color Utilities
 *
 * This file provides utilities for getting colors based on daily progress status.
 */

import type { DailyProgressStatus } from "../../types";
import { STATUS_COLOR_MAP, type StatusColorConfig } from "../../types/dashboard.types";

/**
 * Pobiera konfigurację kolorów dla danego statusu
 */
export function getStatusColor(status: DailyProgressStatus): StatusColorConfig {
  return STATUS_COLOR_MAP[status];
}

/**
 * Pobiera klasę koloru tła dla danego statusu
 */
export function getStatusBgClass(status: DailyProgressStatus): string {
  return STATUS_COLOR_MAP[status].bg;
}

/**
 * Pobiera klasę koloru tekstu dla danego statusu
 */
export function getStatusTextClass(status: DailyProgressStatus): string {
  return STATUS_COLOR_MAP[status].text;
}

/**
 * Pobiera klasę koloru obramowania dla danego statusu
 */
export function getStatusBorderClass(status: DailyProgressStatus): string {
  return STATUS_COLOR_MAP[status].border;
}
