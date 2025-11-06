/**
 * useInfiniteScroll Hook
 *
 * Generic hook dla infinite scroll functionality.
 * Zarządza stanem paginacji i ładowania kolejnych stron.
 */

import { useCallback, useState } from "react";

type UseInfiniteScrollParams<T> = {
  fetchFunction: (limit: number, offset: number) => Promise<T[]>;
  limit: number;
  onError?: (error: Error) => void;
};

type UseInfiniteScrollReturn<T> = {
  items: T[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
};

export function useInfiniteScroll<T>({
  fetchFunction,
  limit,
  onError,
}: UseInfiniteScrollParams<T>): UseInfiniteScrollReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  /**
   * Ładuje więcej elementów
   */
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const newItems = await fetchFunction(limit, offset);

      setItems((prev) => [...prev, ...newItems]);
      setOffset((prev) => prev + newItems.length);

      // Jeśli otrzymaliśmy mniej niż limit, to nie ma więcej
      if (newItems.length < limit) {
        setHasMore(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      if (onError && err instanceof Error) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, fetchFunction, limit, offset, onError]);

  /**
   * Odświeża listę od początku
   */
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setOffset(0);
    setHasMore(true);

    try {
      const newItems = await fetchFunction(limit, 0);

      setItems(newItems);
      setOffset(newItems.length);

      if (newItems.length < limit) {
        setHasMore(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      if (onError && err instanceof Error) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, limit, onError]);

  /**
   * Resetuje stan do wartości początkowych
   */
  const reset = useCallback(() => {
    setItems([]);
    setLoading(false);
    setError(null);
    setHasMore(true);
    setOffset(0);
  }, []);

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    reset,
  };
}
