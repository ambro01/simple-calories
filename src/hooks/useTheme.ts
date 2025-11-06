/**
 * useTheme Hook
 *
 * Hook zarządzający motywem aplikacji (jasny/ciemny).
 * Wykorzystuje localStorage do persystencji preferencji użytkownika.
 */

import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

type UseThemeReturn = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Inicjalizacja z localStorage lub domyślnie 'light'
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as Theme) || "light";
    }
    return "light";
  });

  /**
   * Aktualizuje motyw w DOM i localStorage
   */
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);

    // Aktualizuj localStorage
    localStorage.setItem("theme", newTheme);

    // Aktualizuj klasę na <html>
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  /**
   * Przełącza między jasnym a ciemnym motywem
   */
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  /**
   * Synchronizuj motyw przy montowaniu komponentu
   */
  useEffect(() => {
    const currentTheme = localStorage.getItem("theme") as Theme;
    if (currentTheme && currentTheme !== theme) {
      setTheme(currentTheme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    theme,
    toggleTheme,
    setTheme,
  };
}
