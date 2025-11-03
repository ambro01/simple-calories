/**
 * InfiniteScrollTrigger Component
 *
 * Niewidoczny element służący jako trigger dla infinite scroll (Intersection Observer).
 * Trigger tylko gdy hasMore === true i loading === false.
 */

import { useEffect, useRef } from "react";

interface InfiniteScrollTriggerProps {
  onIntersect: () => void;
  hasMore: boolean;
  loading: boolean;
}

export function InfiniteScrollTrigger({ onIntersect, hasMore, loading }: InfiniteScrollTriggerProps) {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onIntersect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(trigger);

    return () => {
      observer.disconnect();
    };
  }, [onIntersect, hasMore, loading]);

  // Nie renderuj triggera jeśli nie ma więcej danych
  if (!hasMore) return null;

  return <div ref={triggerRef} className="h-1 w-full" aria-hidden="true" />;
}
