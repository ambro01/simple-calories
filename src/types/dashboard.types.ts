/**
 * Dashboard View Type Definitions
 *
 * This file contains all type definitions specific to the Dashboard view,
 * including state management, component props, and view models.
 */

import type { DailyProgressResponseDTO } from "../types";

/**
 * Stan głównego dashboardu
 */
export interface DashboardState {
  days: DailyProgressResponseDTO[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  offset: number;
  limit: number;
  selectedDate: string | null; // dla desktop two-pane
  refreshing: boolean; // pull-to-refresh state
  isRefetchingAfterChange: boolean; // silent refetch after meal add/edit/delete
}

/**
 * Parametry infinite scroll
 */
export interface InfiniteScrollParams {
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Mapowanie statusów na kolory Tailwind
 */
export interface StatusColorConfig {
  bg: string;
  text: string;
  border: string;
}

export const STATUS_COLOR_MAP: Record<"under" | "on_track" | "over", StatusColorConfig> = {
  under: {
    bg: "bg-sky-400",
    text: "text-gray-700",
    border: "border-gray-300",
  },
  on_track: {
    bg: "bg-green-500",
    text: "text-green-700",
    border: "border-green-400",
  },
  over: {
    bg: "bg-orange-500",
    text: "text-orange-700",
    border: "border-orange-400",
  },
};

/**
 * Limity paginacji
 */
export const PAGINATION_LIMITS = {
  DASHBOARD_DAYS_LIMIT: 30,
  DAY_DETAILS_MEALS_LIMIT: 100,
};
