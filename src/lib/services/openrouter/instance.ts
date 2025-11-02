import { OpenRouterService } from './openrouter.service';

let instance: OpenRouterService | null = null;

/**
 * Zwraca singleton instancję OpenRouterService
 *
 * Tworzy nową instancję przy pierwszym wywołaniu,
 * następnie zwraca tę samą instancję przy kolejnych wywołaniach.
 *
 * @returns Instancja OpenRouterService
 * @throws Error jeśli brak klucza API w zmiennej środowiskowej
 */
export function getOpenRouterService(): OpenRouterService {
  if (!instance) {
    instance = new OpenRouterService();
  }
  return instance;
}

/**
 * Resetuje singleton instancję (przydatne w testach)
 */
export function resetOpenRouterService(): void {
  instance = null;
}
