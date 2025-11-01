/**
 * useMediaQuery Hook
 *
 * Hook do wykrywania media queries w React.
 * Używany do określania breakpointów (desktop/mobile).
 */

import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    // SSR safety: zwróć false podczas server-side rendering
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    // SSR safety
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(query);

    // Update state if query changes
    setMatches(mediaQuery.matches);

    // Handler dla zmian
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Dodaj listener
    mediaQuery.addEventListener("change", handler);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener("change", handler);
    };
  }, [query]);

  return matches;
}

/**
 * Predefiniowane breakpointy zgodne z Tailwind
 */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)"); // lg breakpoint
}

export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 1023px)");
}
