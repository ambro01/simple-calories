# Plan wdrożenia usługi OpenRouter

## 1. Opis usługi

Usługa OpenRouter jest warstwą abstrakcji do komunikacji z API OpenRouter.ai, zapewniającą:

- Bezpieczne zarządzanie kluczami API
- Konstruowanie i wysyłanie zapytań do modeli LLM
- Obsługę ustrukturyzowanych odpowiedzi przez JSON Schema
- Zarządzanie błędami i limitami API
- Wsparcie dla różnych modeli (OpenAI, Anthropic, Google, etc.)
- Type-safe interfejs dla TypeScript

Usługa będzie wykorzystywana w aplikacji Astro + React do funkcji związanych z analizą posiłków, generowaniem sugestii żywieniowych i asystentem AI.

## 2. Struktura plików

```
src/
  lib/
    services/
      openrouter/
        OpenRouterService.ts          # Główna klasa usługi
        types.ts                       # Typy TypeScript
        errors.ts                      # Custom error classes
        schemas.ts                     # JSON Schemas dla response_format
        config.ts                      # Konfiguracja i konstanty
```

## 3. Typy TypeScript (types.ts)

```typescript
// Rola w konwersacji
export type MessageRole = "system" | "user" | "assistant";

// Pojedyncza wiadomość
export interface Message {
  role: MessageRole;
  content: string;
}

// Parametry modelu
export interface ModelParameters {
  temperature?: number; // 0-2, default: 1
  max_tokens?: number; // Max tokens w odpowiedzi
  top_p?: number; // 0-1, default: 1
  frequency_penalty?: number; // -2 do 2, default: 0
  presence_penalty?: number; // -2 do 2, default: 0
  stop?: string[]; // Stop sequences
}

// JSON Schema format dla ustrukturyzowanych odpowiedzi
export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: {
      type: "object";
      properties: Record<string, any>;
      required: string[];
      additionalProperties?: boolean;
    };
  };
}

// Request do OpenRouter API
export interface OpenRouterRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  response_format?: ResponseFormat;
  stop?: string[];
}

// Response z OpenRouter API
export interface OpenRouterResponse {
  id: string;
  model: string;
  created: number;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Opcje dla pojedynczego zapytania
export interface ChatCompletionOptions {
  systemPrompt?: string;
  userMessage: string;
  model?: string;
  parameters?: ModelParameters;
  responseFormat?: ResponseFormat;
  conversationHistory?: Message[];
}

// Wynik parsowania odpowiedzi
export interface ParsedResponse<T = any> {
  content: string;
  data?: T;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

## 4. Obsługa błędów (errors.ts)

```typescript
// Bazowa klasa błędu OpenRouter
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

// Błąd autoryzacji (401)
export class UnauthorizedError extends OpenRouterError {
  constructor(message = "Invalid API key") {
    super(message, 401);
    this.name = "UnauthorizedError";
  }
}

// Błąd rate limit (429)
export class RateLimitError extends OpenRouterError {
  constructor(
    message = "Rate limit exceeded",
    public retryAfter?: number
  ) {
    super(message, 429);
    this.name = "RateLimitError";
  }
}

// Błąd walidacji (400)
export class ValidationError extends OpenRouterError {
  constructor(
    message: string,
    public details?: any
  ) {
    super(message, 400);
    this.name = "ValidationError";
  }
}

// Błąd serwera (500+)
export class ServerError extends OpenRouterError {
  constructor(message = "OpenRouter server error", statusCode = 500) {
    super(message, statusCode);
    this.name = "ServerError";
  }
}

// Błąd timeout
export class TimeoutError extends OpenRouterError {
  constructor(message = "Request timeout") {
    super(message);
    this.name = "TimeoutError";
  }
}

// Błąd parsowania odpowiedzi
export class ParseError extends OpenRouterError {
  constructor(
    message = "Failed to parse response",
    public rawResponse?: string
  ) {
    super(message);
    this.name = "ParseError";
  }
}

// Błąd przekroczenia quota
export class QuotaExceededError extends OpenRouterError {
  constructor(message = "API quota exceeded") {
    super(message, 429);
    this.name = "QuotaExceededError";
  }
}
```

## 5. Konfiguracja (config.ts)

```typescript
// Domyślne wartości konfiguracji
export const DEFAULT_CONFIG = {
  API_URL: "https://openrouter.ai/api/v1/chat/completions",
  DEFAULT_MODEL: "openai/gpt-3.5-turbo",
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_MAX_TOKENS: 1000,
  DEFAULT_TIMEOUT: 30000, // 30 sekund
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 sekunda
  RETRY_MULTIPLIER: 2, // Exponential backoff
} as const;

// Dostępne modele (przykłady)
export const AVAILABLE_MODELS = {
  // OpenAI
  GPT_4_TURBO: "openai/gpt-4-turbo",
  GPT_4: "openai/gpt-4",
  GPT_35_TURBO: "openai/gpt-3.5-turbo",

  // Anthropic
  CLAUDE_3_OPUS: "anthropic/claude-3-opus",
  CLAUDE_3_SONNET: "anthropic/claude-3-sonnet",
  CLAUDE_3_HAIKU: "anthropic/claude-3-haiku",

  // Google
  GEMINI_PRO: "google/gemini-pro",

  // Meta
  LLAMA_3_70B: "meta-llama/llama-3-70b-instruct",
} as const;

// Walidacja parametrów modelu
export function validateModelParameters(params: ModelParameters): void {
  if (params.temperature !== undefined) {
    if (params.temperature < 0 || params.temperature > 2) {
      throw new Error("Temperature must be between 0 and 2");
    }
  }

  if (params.top_p !== undefined) {
    if (params.top_p < 0 || params.top_p > 1) {
      throw new Error("top_p must be between 0 and 1");
    }
  }

  if (params.frequency_penalty !== undefined) {
    if (params.frequency_penalty < -2 || params.frequency_penalty > 2) {
      throw new Error("frequency_penalty must be between -2 and 2");
    }
  }

  if (params.presence_penalty !== undefined) {
    if (params.presence_penalty < -2 || params.presence_penalty > 2) {
      throw new Error("presence_penalty must be between -2 and 2");
    }
  }
}
```

## 6. JSON Schemas (schemas.ts)

```typescript
import type { ResponseFormat } from "./types";

// Schema dla analizy posiłku
export const mealAnalysisSchema: ResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "meal_analysis",
    strict: true,
    schema: {
      type: "object",
      properties: {
        totalCalories: {
          type: "number",
          description: "Total calories in the meal",
        },
        totalProtein: {
          type: "number",
          description: "Total protein in grams",
        },
        totalCarbs: {
          type: "number",
          description: "Total carbohydrates in grams",
        },
        totalFat: {
          type: "number",
          description: "Total fat in grams",
        },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              quantity: { type: "number" },
              unit: { type: "string" },
              calories: { type: "number" },
              protein: { type: "number" },
              carbs: { type: "number" },
              fat: { type: "number" },
            },
            required: ["name", "quantity", "unit", "calories", "protein", "carbs", "fat"],
            additionalProperties: false,
          },
        },
      },
      required: ["totalCalories", "totalProtein", "totalCarbs", "totalFat", "items"],
      additionalProperties: false,
    },
  },
};

// Schema dla sugestii żywieniowych
export const nutritionSuggestionSchema: ResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "nutrition_suggestion",
    strict: true,
    schema: {
      type: "object",
      properties: {
        suggestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              priority: {
                type: "string",
                enum: ["high", "medium", "low"],
              },
            },
            required: ["title", "description", "priority"],
            additionalProperties: false,
          },
        },
        overallAssessment: { type: "string" },
      },
      required: ["suggestions", "overallAssessment"],
      additionalProperties: false,
    },
  },
};

// Helper do tworzenia custom schema
export function createCustomSchema(name: string, schema: ResponseFormat["json_schema"]["schema"]): ResponseFormat {
  return {
    type: "json_schema",
    json_schema: {
      name,
      strict: true,
      schema,
    },
  };
}
```

## 7. Główna klasa usługi (OpenRouterService.ts)

### 7.1. Konstruktor

```typescript
import type {
  Message,
  ModelParameters,
  OpenRouterRequest,
  OpenRouterResponse,
  ChatCompletionOptions,
  ParsedResponse,
  ResponseFormat,
} from "./types";
import {
  OpenRouterError,
  UnauthorizedError,
  RateLimitError,
  ValidationError,
  ServerError,
  TimeoutError,
  ParseError,
  QuotaExceededError,
} from "./errors";
import { DEFAULT_CONFIG, validateModelParameters } from "./config";

export class OpenRouterService {
  private apiKey: string;
  private apiUrl: string;
  private defaultModel: string;
  private timeout: number;
  private maxRetries: number;
  private retryDelay: number;
  private retryMultiplier: number;

  /**
   * Tworzy instancję OpenRouterService
   *
   * @param apiKey - Klucz API OpenRouter (opcjonalnie z env)
   * @param options - Dodatkowe opcje konfiguracji
   */
  constructor(
    apiKey?: string,
    options?: {
      apiUrl?: string;
      defaultModel?: string;
      timeout?: number;
      maxRetries?: number;
    }
  ) {
    // Pobierz API key z parametru lub zmiennej środowiskowej
    this.apiKey = apiKey || import.meta.env.OPENROUTER_API_KEY || "";

    if (!this.apiKey) {
      throw new Error("OpenRouter API key is required");
    }

    // Ustaw konfigurację
    this.apiUrl = options?.apiUrl || DEFAULT_CONFIG.API_URL;
    this.defaultModel = options?.defaultModel || DEFAULT_CONFIG.DEFAULT_MODEL;
    this.timeout = options?.timeout || DEFAULT_CONFIG.DEFAULT_TIMEOUT;
    this.maxRetries = options?.maxRetries || DEFAULT_CONFIG.MAX_RETRIES;
    this.retryDelay = DEFAULT_CONFIG.RETRY_DELAY;
    this.retryMultiplier = DEFAULT_CONFIG.RETRY_MULTIPLIER;
  }
}
```

### 7.2. Publiczne metody

```typescript
  /**
   * Wysyła zapytanie do modelu LLM i zwraca odpowiedź
   *
   * @param options - Opcje zapytania
   * @returns Parsowana odpowiedź z modelu
   */
  async chatCompletion<T = any>(
    options: ChatCompletionOptions
  ): Promise<ParsedResponse<T>> {
    // Buduj wiadomości
    const messages = this.buildMessages(
      options.userMessage,
      options.systemPrompt,
      options.conversationHistory
    );

    // Waliduj parametry
    if (options.parameters) {
      validateModelParameters(options.parameters);
    }

    // Przygotuj request
    const request: OpenRouterRequest = {
      model: options.model || this.defaultModel,
      messages,
      temperature: options.parameters?.temperature ?? DEFAULT_CONFIG.DEFAULT_TEMPERATURE,
      max_tokens: options.parameters?.max_tokens ?? DEFAULT_CONFIG.DEFAULT_MAX_TOKENS,
      top_p: options.parameters?.top_p,
      frequency_penalty: options.parameters?.frequency_penalty,
      presence_penalty: options.parameters?.presence_penalty,
      response_format: options.responseFormat,
      stop: options.parameters?.stop
    };

    // Wyślij request z retry logic
    const response = await this.sendRequestWithRetry(request);

    // Parsuj odpowiedź
    return this.parseResponse<T>(response, options.responseFormat);
  }

  /**
   * Wysyła proste zapytanie text-only
   *
   * @param userMessage - Wiadomość użytkownika
   * @param systemPrompt - Opcjonalny system prompt
   * @param model - Opcjonalny model (default: defaultModel)
   * @returns Treść odpowiedzi jako string
   */
  async simpleChat(
    userMessage: string,
    systemPrompt?: string,
    model?: string
  ): Promise<string> {
    const response = await this.chatCompletion({
      userMessage,
      systemPrompt,
      model
    });

    return response.content;
  }

  /**
   * Wysyła zapytanie z oczekiwanym JSON response
   *
   * @param userMessage - Wiadomość użytkownika
   * @param responseFormat - Schema JSON dla odpowiedzi
   * @param systemPrompt - Opcjonalny system prompt
   * @param model - Opcjonalny model
   * @returns Sparsowane dane JSON
   */
  async structuredChat<T>(
    userMessage: string,
    responseFormat: ResponseFormat,
    systemPrompt?: string,
    model?: string
  ): Promise<T> {
    const response = await this.chatCompletion<T>({
      userMessage,
      systemPrompt,
      responseFormat,
      model
    });

    if (!response.data) {
      throw new ParseError('Expected structured data but got none');
    }

    return response.data;
  }

  /**
   * Kontynuuje istniejącą konwersację
   *
   * @param userMessage - Nowa wiadomość użytkownika
   * @param conversationHistory - Historia konwersacji
   * @param model - Opcjonalny model
   * @returns Odpowiedź z zaktualizowaną historią
   */
  async continueConversation(
    userMessage: string,
    conversationHistory: Message[],
    model?: string
  ): Promise<{ response: string; updatedHistory: Message[] }> {
    const result = await this.chatCompletion({
      userMessage,
      conversationHistory,
      model
    });

    // Aktualizuj historię
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user' as const, content: userMessage },
      { role: 'assistant' as const, content: result.content }
    ];

    return {
      response: result.content,
      updatedHistory
    };
  }
```

### 7.3. Prywatne metody

```typescript
  /**
   * Buduje tablicę wiadomości dla API
   */
  private buildMessages(
    userMessage: string,
    systemPrompt?: string,
    conversationHistory?: Message[]
  ): Message[] {
    const messages: Message[] = [];

    // Dodaj system prompt jeśli istnieje
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }

    // Dodaj historię konwersacji jeśli istnieje
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }

    // Dodaj aktualną wiadomość użytkownika
    messages.push({
      role: 'user',
      content: userMessage
    });

    return messages;
  }

  /**
   * Wysyła request do API z obsługą retry
   */
  private async sendRequestWithRetry(
    request: OpenRouterRequest,
    attempt = 0
  ): Promise<OpenRouterResponse> {
    try {
      return await this.sendRequest(request);
    } catch (error) {
      // Sprawdź czy należy ponowić próbę
      if (this.shouldRetry(error, attempt)) {
        const delay = this.calculateRetryDelay(attempt);
        await this.sleep(delay);
        return this.sendRequestWithRetry(request, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Wysyła pojedynczy request do API
   */
  private async sendRequest(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
          'X-Title': 'Simple Calories App'
        },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Obsługa błędów HTTP
      if (!response.ok) {
        await this.handleHttpError(response);
      }

      const data = await response.json();
      return data as OpenRouterResponse;

    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new TimeoutError(`Request timeout after ${this.timeout}ms`);
      }

      throw error;
    }
  }

  /**
   * Obsługuje błędy HTTP
   */
  private async handleHttpError(response: Response): Promise<never> {
    const status = response.status;
    let errorMessage = response.statusText;

    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorMessage;
    } catch {
      // Ignore JSON parse errors
    }

    switch (status) {
      case 401:
        throw new UnauthorizedError(errorMessage);

      case 429:
        const retryAfter = response.headers.get('Retry-After');
        throw new RateLimitError(
          errorMessage,
          retryAfter ? parseInt(retryAfter, 10) : undefined
        );

      case 400:
        throw new ValidationError(errorMessage);

      case 402:
        throw new QuotaExceededError(errorMessage);

      case 500:
      case 502:
      case 503:
      case 504:
        throw new ServerError(errorMessage, status);

      default:
        throw new OpenRouterError(errorMessage, status);
    }
  }

  /**
   * Parsuje odpowiedź z API
   */
  private parseResponse<T>(
    response: OpenRouterResponse,
    responseFormat?: ResponseFormat
  ): ParsedResponse<T> {
    const choice = response.choices[0];
    if (!choice) {
      throw new ParseError('No choices in response');
    }

    const content = choice.message.content;
    let parsedData: T | undefined;

    // Jeśli oczekujemy JSON, sparsuj go
    if (responseFormat) {
      try {
        parsedData = JSON.parse(content) as T;
      } catch (error) {
        throw new ParseError('Failed to parse JSON response', content);
      }
    }

    return {
      content,
      data: parsedData,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      }
    };
  }

  /**
   * Sprawdza czy należy ponowić próbę
   */
  private shouldRetry(error: any, attempt: number): boolean {
    if (attempt >= this.maxRetries) {
      return false;
    }

    // Retry tylko dla określonych błędów
    return (
      error instanceof RateLimitError ||
      error instanceof ServerError ||
      error instanceof TimeoutError
    );
  }

  /**
   * Oblicza opóźnienie dla retry (exponential backoff)
   */
  private calculateRetryDelay(attempt: number): number {
    return this.retryDelay * Math.pow(this.retryMultiplier, attempt);
  }

  /**
   * Helper do opóźnienia
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
```

### 7.4. Publiczne gettery

```typescript
  /**
   * Zwraca aktualnie używany model
   */
  getDefaultModel(): string {
    return this.defaultModel;
  }

  /**
   * Ustawia domyślny model
   */
  setDefaultModel(model: string): void {
    this.defaultModel = model;
  }

  /**
   * Zwraca konfigurację timeout
   */
  getTimeout(): number {
    return this.timeout;
  }

  /**
   * Ustawia timeout
   */
  setTimeout(timeout: number): void {
    if (timeout <= 0) {
      throw new Error('Timeout must be positive');
    }
    this.timeout = timeout;
  }
}
```

## 8. Obsługa błędów - Best Practices

### 8.1. Hierarchia błędów

Wszystkie błędy dziedziczą z `OpenRouterError`, co pozwala na:

- Catch wszystkich błędów API: `catch (error: OpenRouterError)`
- Catch specyficznych błędów: `catch (error: RateLimitError)`

### 8.2. Scenariusze obsługi błędów

```typescript
try {
  const result = await openRouterService.chatCompletion(options);
  // Użyj result
} catch (error) {
  if (error instanceof UnauthorizedError) {
    // Nieprawidłowy klucz API - poinformuj admina
    console.error("Invalid API key - check configuration");
  } else if (error instanceof RateLimitError) {
    // Rate limit - czekaj i spróbuj ponownie lub poinformuj użytkownika
    console.error(`Rate limit exceeded, retry after: ${error.retryAfter}s`);
  } else if (error instanceof ValidationError) {
    // Błędne parametry - napraw i wyślij ponownie
    console.error("Invalid parameters:", error.details);
  } else if (error instanceof QuotaExceededError) {
    // Wyczerpano quota - poinformuj admina
    console.error("API quota exceeded - check billing");
  } else if (error instanceof ServerError) {
    // Błąd serwera - retry jest już obsłużony automatycznie
    console.error("OpenRouter server error");
  } else if (error instanceof TimeoutError) {
    // Timeout - rozważ zwiększenie timeout lub poinformuj użytkownika
    console.error("Request timeout");
  } else if (error instanceof ParseError) {
    // Błąd parsowania - może być problem z modelem lub schematem
    console.error("Failed to parse response:", error.rawResponse);
  } else if (error instanceof OpenRouterError) {
    // Inny błąd API
    console.error("OpenRouter error:", error.message);
  } else {
    // Nieoczekiwany błąd
    console.error("Unexpected error:", error);
  }
}
```

### 8.3. Retry Logic

Usługa automatycznie ponawia próby dla:

- `RateLimitError` - z exponential backoff
- `ServerError` - błędy 5xx
- `TimeoutError` - timeout połączenia

Maksymalna liczba prób: `maxRetries` (default: 3)

## 9. Kwestie bezpieczeństwa

### 9.1. Przechowywanie klucza API

**Nigdy nie commit'uj klucza API do repo!**

Utwórz plik `.env` (dodaj do `.gitignore`):

```env
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxx
```

W Astro, użyj `import.meta.env`:

```typescript
const apiKey = import.meta.env.OPENROUTER_API_KEY;
```

### 9.2. Server-side tylko

**Klucz API powinien być używany tylko server-side!**

W Astro:

- Używaj w API routes (`src/pages/api/*.ts`)
- Używaj w server-side code (części plików `.astro` poza `---`)
- **NIE używaj** w client-side JavaScript/React komponentach

### 9.3. Rate Limiting po stronie klienta

Implementuj dodatkowe rate limiting w aplikacji, aby uniknąć nadmiernego wykorzystania API:

```typescript
class RateLimiter {
  private requests: number[] = [];
  private limit: number;
  private window: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.window = windowMs;
  }

  async checkLimit(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter((time) => now - time < this.window);

    if (this.requests.length >= this.limit) {
      const oldestRequest = this.requests[0];
      const waitTime = this.window - (now - oldestRequest);
      throw new Error(`Rate limit: wait ${waitTime}ms`);
    }

    this.requests.push(now);
  }
}
```

### 9.4. Sanityzacja inputów

Zawsze sanityzuj user input przed wysłaniem do API:

```typescript
function sanitizeUserInput(input: string): string {
  // Usuń nadmierne białe znaki
  input = input.trim();

  // Ogranicz długość
  const MAX_LENGTH = 4000;
  if (input.length > MAX_LENGTH) {
    input = input.substring(0, MAX_LENGTH);
  }

  return input;
}
```

## 10. Plan wdrożenia krok po kroku

### Krok 1: Przygotowanie środowiska

1. Utwórz katalog dla usługi:

```bash
mkdir -p src/lib/services/openrouter
```

2. Dodaj klucz API do `.env`:

```bash
echo "OPENROUTER_API_KEY=your-key-here" >> .env
```

3. Upewnij się, że `.env` jest w `.gitignore`:

```bash
echo ".env" >> .gitignore
```

### Krok 2: Implementacja typów i błędów

1. Utwórz `src/lib/services/openrouter/types.ts` z definicjami typów (jak w sekcji 3)
2. Utwórz `src/lib/services/openrouter/errors.ts` z klasami błędów (jak w sekcji 4)
3. Utwórz `src/lib/services/openrouter/config.ts` z konfiguracją (jak w sekcji 5)

### Krok 3: Implementacja schematów JSON

1. Utwórz `src/lib/services/openrouter/schemas.ts` z przykładowymi schematami (jak w sekcji 6)
2. Dodaj schemat specyficzny dla aplikacji (analiza posiłków)

### Krok 4: Implementacja głównej klasy

1. Utwórz `src/lib/services/openrouter/OpenRouterService.ts`
2. Implementuj konstruktor (sekcja 7.1)
3. Implementuj prywatne metody (sekcja 7.3) - od najbardziej low-level:
   - `sleep()`
   - `calculateRetryDelay()`
   - `shouldRetry()`
   - `parseResponse()`
   - `handleHttpError()`
   - `sendRequest()`
   - `sendRequestWithRetry()`
   - `buildMessages()`
4. Implementuj publiczne metody (sekcja 7.2):
   - `chatCompletion()`
   - `simpleChat()`
   - `structuredChat()`
   - `continueConversation()`
5. Implementuj gettery/settery (sekcja 7.4)

### Krok 5: Export usługi

Utwórz `src/lib/services/openrouter/index.ts`:

```typescript
export { OpenRouterService } from "./OpenRouterService";
export * from "./types";
export * from "./errors";
export * from "./schemas";
export * from "./config";
```

### Krok 6: Utworzenie singleton instance

Utwórz `src/lib/services/openrouter/instance.ts`:

```typescript
import { OpenRouterService } from "./OpenRouterService";

let instance: OpenRouterService | null = null;

export function getOpenRouterService(): OpenRouterService {
  if (!instance) {
    instance = new OpenRouterService();
  }
  return instance;
}
```

### Krok 7: Testowanie podstawowe

Utwórz API endpoint do testowania: `src/pages/api/test-openrouter.ts`:

```typescript
import type { APIRoute } from "astro";
import { getOpenRouterService } from "@/lib/services/openrouter/instance";

export const GET: APIRoute = async () => {
  try {
    const service = getOpenRouterService();

    const response = await service.simpleChat(
      'Say hello in JSON format with a "message" field',
      "You are a helpful assistant"
    );

    return new Response(
      JSON.stringify({
        success: true,
        response,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

Test:

```bash
curl http://localhost:4321/api/test-openrouter
```

### Krok 8: Implementacja funkcji dla aplikacji

Utwórz wrapper dla analizy posiłków: `src/lib/services/openrouter/meals.ts`:

```typescript
import { getOpenRouterService } from "./instance";
import { mealAnalysisSchema } from "./schemas";
import type { ParsedResponse } from "./types";

interface MealAnalysis {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
}

export async function analyzeMeal(mealDescription: string): Promise<MealAnalysis> {
  const service = getOpenRouterService();

  const systemPrompt = `You are a nutrition expert. Analyze the meal description and provide detailed nutritional information. Be as accurate as possible based on standard serving sizes.`;

  const userMessage = `Analyze this meal and provide nutritional breakdown: ${mealDescription}`;

  return await service.structuredChat<MealAnalysis>(userMessage, mealAnalysisSchema, systemPrompt);
}
```

### Krok 9: Integracja z API routes

Utwórz endpoint dla analizy posiłków: `src/pages/api/v1/meals/analyze.ts`:

```typescript
import type { APIRoute } from "astro";
import { analyzeMeal } from "@/lib/services/openrouter/meals";
import { OpenRouterError, ValidationError, RateLimitError } from "@/lib/services/openrouter";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    if (!body.description) {
      return new Response(
        JSON.stringify({
          error: "Meal description is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const analysis = await analyzeMeal(body.description);

    return new Response(
      JSON.stringify({
        success: true,
        data: analysis,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Meal analysis error:", error);

    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({
          error: "Invalid request parameters",
        }),
        { status: 400 }
      );
    }

    if (error instanceof RateLimitError) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded, please try again later",
        }),
        {
          status: 429,
          headers: {
            "Retry-After": error.retryAfter?.toString() || "60",
          },
        }
      );
    }

    if (error instanceof OpenRouterError) {
      return new Response(
        JSON.stringify({
          error: "AI service error",
        }),
        { status: 503 }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      { status: 500 }
    );
  }
};
```

### Krok 10: Użycie w React komponentach

Przykład użycia w komponencie React:

```typescript
import { useState } from 'react';

export function MealAnalyzer() {
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyzeMeal = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/v1/meals/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze meal');
      }

      setResult(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe your meal..."
      />
      <button onClick={analyzeMeal} disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze Meal'}
      </button>

      {error && <div className="error">{error}</div>}
      {result && (
        <div>
          <h3>Results:</h3>
          <p>Total Calories: {result.totalCalories}</p>
          <ul>
            {result.items.map((item: any, i: number) => (
              <li key={i}>
                {item.name}: {item.calories} cal
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

### Krok 11: Dokumentacja użycia

Utwórz `src/lib/services/openrouter/README.md` z przykładami użycia:

```markdown
# OpenRouter Service - Dokumentacja użycia

## Podstawowe użycie

### Proste zapytanie text

\`\`\`typescript
const service = getOpenRouterService();
const response = await service.simpleChat(
'What is 2+2?',
'You are a math tutor'
);
\`\`\`

### Zapytanie ze strukturalną odpowiedzią

\`\`\`typescript
const data = await service.structuredChat<MealAnalysis>(
'Analyze: eggs and toast',
mealAnalysisSchema,
'You are a nutrition expert'
);
\`\`\`

### Konwersacja z historią

\`\`\`typescript
const history: Message[] = [
{ role: 'user', content: 'Hello' },
{ role: 'assistant', content: 'Hi! How can I help?' }
];

const { response, updatedHistory } = await service.continueConversation(
'Tell me about nutrition',
history
);
\`\`\`

## Obsługa błędów

Zawsze używaj try-catch i obsługuj specyficzne błędy.

## Rate Limiting

Usługa automatycznie retry przy rate limits, ale rozważ dodanie
rate limitingu po stronie aplikacji.
```

### Krok 12: Testing i deployment

1. Przetestuj wszystkie metody usługi lokalnie
2. Przetestuj error handling (nieprawidłowy klucz API, timeout, etc.)
3. Przetestuj rate limiting
4. Zweryfikuj działanie w produkcji z prawdziwymi zapytaniami
5. Monitoruj usage i koszta przez dashboard OpenRouter
6. Skonfiguruj limity finansowe w panelu OpenRouter

## 11. Dodatkowe wskazówki

### 11.1. Monitoring i logowanie

Rozważ dodanie logowania dla celów debugging i monitoringu:

```typescript
private log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  const logData = {
    timestamp: new Date().toISOString(),
    level,
    service: 'OpenRouterService',
    message,
    data
  };

  // W produkcji: wyślij do systemu monitoringu
  // W development: console.log
  if (import.meta.env.DEV) {
    console[level](logData);
  }
}
```

### 11.2. Caching odpowiedzi

Dla często używanych zapytań, rozważ caching:

```typescript
private cache = new Map<string, { data: any; timestamp: number }>();
private cacheTTL = 5 * 60 * 1000; // 5 minut

private getCacheKey(request: OpenRouterRequest): string {
  return JSON.stringify(request);
}

private getCached(key: string): any | null {
  const cached = this.cache.get(key);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > this.cacheTTL) {
    this.cache.delete(key);
    return null;
  }

  return cached.data;
}
```

### 11.3. Token counting

Dla lepszego zarządzania kosztami, dodaj token counting:

```typescript
import { encode } from 'gpt-tokenizer'; // npm install gpt-tokenizer

estimateTokens(text: string): number {
  return encode(text).length;
}

estimateRequestCost(messages: Message[], model: string): number {
  const totalTokens = messages.reduce(
    (sum, msg) => sum + this.estimateTokens(msg.content),
    0
  );

  // Ceny per 1M tokenów (przykładowe)
  const prices: Record<string, number> = {
    'openai/gpt-4-turbo': 10.00,
    'openai/gpt-3.5-turbo': 0.50,
    // ... inne modele
  };

  const pricePerMillion = prices[model] || 1.00;
  return (totalTokens / 1_000_000) * pricePerMillion;
}
```

### 11.4. Streaming responses (opcjonalne)

Dla długich odpowiedzi, rozważ streaming:

```typescript
async streamChat(
  options: ChatCompletionOptions,
  onChunk: (chunk: string) => void
): Promise<void> {
  // OpenRouter supports SSE streaming
  const request = { ...this.buildRequest(options), stream: true };

  const response = await fetch(this.apiUrl, {
    method: 'POST',
    headers: this.buildHeaders(),
    body: JSON.stringify(request)
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;

    const chunk = decoder.decode(value);
    onChunk(chunk);
  }
}
```

## 12. Podsumowanie

Po wykonaniu wszystkich kroków będziesz mieć:

- ✅ Pełną, type-safe usługę OpenRouter
- ✅ Obsługę błędów i retry logic
- ✅ Wsparcie dla ustrukturyzowanych odpowiedzi
- ✅ Bezpieczne zarządzanie kluczami API
- ✅ API endpoints gotowe do użycia
- ✅ Przykłady integracji z React
- ✅ Dokumentację i best practices

Usługa jest gotowa do rozbudowy o dodatkowe features specyficzne dla aplikacji Simple Calories.
