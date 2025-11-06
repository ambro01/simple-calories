/**
 * useSettings Hook
 *
 * Główny hook zarządzający stanem Settings view.
 * Obsługuje pobieranie danych użytkownika, cel kaloryczny, i wylogowanie.
 */

import { useCallback, useEffect, useState } from "react";
import type { ProfileResponseDTO, CalorieGoalResponseDTO } from "@/types";
import type { SettingsViewModel } from "@/types/settings.types";

type UseSettingsReturn = {
  state: SettingsViewModel;
  openEditGoalDialog: () => void;
  closeEditGoalDialog: () => void;
  openChangePasswordDialog: () => void;
  closeChangePasswordDialog: () => void;
  openLogoutDialog: () => void;
  closeLogoutDialog: () => void;
  logout: () => Promise<void>;
  refreshData: () => Promise<void>;
};

/**
 * Pobiera profil użytkownika z API
 */
async function fetchProfile(): Promise<ProfileResponseDTO> {
  const response = await fetch("/api/v1/profile", {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized - please log in");
    }
    if (response.status === 404) {
      throw new Error("Profile not found");
    }
    if (response.status === 500) {
      throw new Error("Server error - please try again later");
    }
    throw new Error(`Failed to fetch profile: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Pobiera aktualny cel kaloryczny z API
 */
async function fetchCurrentGoal(): Promise<CalorieGoalResponseDTO | null> {
  const response = await fetch("/api/v1/calorie-goals/current", {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  if (response.status === 404) {
    // 404 oznacza, że użytkownik nie ma jeszcze celu - to normalna sytuacja
    return null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized - please log in");
    }
    if (response.status === 500) {
      throw new Error("Server error - please try again later");
    }
    throw new Error(`Failed to fetch current goal: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Pobiera email użytkownika z API
 */
async function fetchUserEmail(): Promise<string | null> {
  try {
    const response = await fetch("/api/v1/auth/me", {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.email || null;
  } catch (error) {
    // eslint-disable-next-line no-console -- Error logging for debugging
    console.error("Error fetching user email:", error);
    return null;
  }
}

export function useSettings(): UseSettingsReturn {
  const [state, setState] = useState<SettingsViewModel>({
    profile: null,
    currentGoal: null,
    userEmail: null,
    isLoading: true,
    error: null,
    showEditGoalDialog: false,
    showChangePasswordDialog: false,
    showLogoutDialog: false,
  });

  /**
   * Ładuje wszystkie dane potrzebne na stronie Settings
   */
  const loadData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Pobierz wszystkie dane równolegle dla lepszej wydajności
      const [profile, currentGoal, userEmail] = await Promise.all([
        fetchProfile(),
        fetchCurrentGoal(),
        fetchUserEmail(),
      ]);

      setState((prev) => ({
        ...prev,
        profile,
        currentGoal,
        userEmail,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      }));
    }
  }, []);

  /**
   * Odświeża dane (wywołane po zapisaniu nowego celu)
   */
  const refreshData = useCallback(async () => {
    // Odśwież dane bez pokazywania loading spinner
    try {
      const [profile, currentGoal, userEmail] = await Promise.all([
        fetchProfile(),
        fetchCurrentGoal(),
        fetchUserEmail(),
      ]);

      setState((prev) => ({
        ...prev,
        profile,
        currentGoal,
        userEmail,
      }));
    } catch (error) {
      // Silent fail - nie zmieniamy error state podczas odświeżania
      // eslint-disable-next-line no-console -- Error logging for debugging
      console.error("Failed to refresh settings data:", error);
    }
  }, []);

  /**
   * Otwiera dialog edycji celu
   */
  const openEditGoalDialog = useCallback(() => {
    setState((prev) => ({ ...prev, showEditGoalDialog: true }));
  }, []);

  /**
   * Zamyka dialog edycji celu
   */
  const closeEditGoalDialog = useCallback(() => {
    setState((prev) => ({ ...prev, showEditGoalDialog: false }));
  }, []);

  /**
   * Otwiera dialog zmiany hasła
   */
  const openChangePasswordDialog = useCallback(() => {
    setState((prev) => ({ ...prev, showChangePasswordDialog: true }));
  }, []);

  /**
   * Zamyka dialog zmiany hasła
   */
  const closeChangePasswordDialog = useCallback(() => {
    setState((prev) => ({ ...prev, showChangePasswordDialog: false }));
  }, []);

  /**
   * Otwiera dialog potwierdzenia wylogowania
   */
  const openLogoutDialog = useCallback(() => {
    setState((prev) => ({ ...prev, showLogoutDialog: true }));
  }, []);

  /**
   * Zamyka dialog potwierdzenia wylogowania
   */
  const closeLogoutDialog = useCallback(() => {
    setState((prev) => ({ ...prev, showLogoutDialog: false }));
  }, []);

  /**
   * Wylogowuje użytkownika i przekierowuje na stronę logowania
   */
  const logout = useCallback(async () => {
    try {
      // Wyloguj użytkownika przez API endpoint
      const response = await fetch("/api/v1/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      // Przekieruj na stronę logowania
      window.location.href = "/auth/login";
    } catch (error) {
      // eslint-disable-next-line no-console -- Error logging for debugging
      console.error("Logout error:", error);
      // Nawet jeśli wystąpił błąd, przekieruj użytkownika
      // (może to być problem z połączeniem, ale lokalnie sesja powinna być wyczyszczona)
      window.location.href = "/auth/login";
    }
  }, []);

  /**
   * Load initial data on mount
   */
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    state,
    openEditGoalDialog,
    closeEditGoalDialog,
    openChangePasswordDialog,
    closeChangePasswordDialog,
    openLogoutDialog,
    closeLogoutDialog,
    logout,
    refreshData,
  };
}
