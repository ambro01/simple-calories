/**
 * useSettings Hook
 *
 * Główny hook zarządzający stanem Settings view.
 * Obsługuje pobieranie danych użytkownika, cel kaloryczny, i wylogowanie.
 */

import { useCallback, useEffect, useState } from "react";
import { supabaseClient } from "@/db/supabase.client";
import type { ProfileResponseDTO, CalorieGoalResponseDTO, ErrorResponseDTO } from "@/types";
import type { SettingsViewModel } from "@/types/settings.types";

interface UseSettingsReturn {
  state: SettingsViewModel;
  openEditGoalDialog: () => void;
  closeEditGoalDialog: () => void;
  openLogoutDialog: () => void;
  closeLogoutDialog: () => void;
  logout: () => Promise<void>;
  refreshData: () => Promise<void>;
}

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
 * Pobiera email użytkownika z Supabase Auth
 */
async function fetchUserEmail(): Promise<string | null> {
  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser();

  if (error) {
    console.error("Error fetching user email:", error);
    return null;
  }

  return user?.email || null;
}

export function useSettings(): UseSettingsReturn {
  const [state, setState] = useState<SettingsViewModel>({
    profile: null,
    currentGoal: null,
    userEmail: null,
    isLoading: true,
    error: null,
    showEditGoalDialog: false,
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
      // Wyloguj użytkownika z Supabase Auth
      const { error } = await supabaseClient.auth.signOut();

      if (error) {
        throw error;
      }

      // Przekieruj na stronę główną lub logowania
      // W MVP może to być po prostu "/" lub dedykowana strona logowania
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      // Nawet jeśli wystąpił błąd, przekieruj użytkownika
      // (może to być problem z połączeniem, ale lokalnie sesja jest już wyczyszczona)
      window.location.href = "/";
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
    openLogoutDialog,
    closeLogoutDialog,
    logout,
    refreshData,
  };
}
