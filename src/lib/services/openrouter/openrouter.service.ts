import type {
  Message,
  OpenRouterRequest,
  OpenRouterResponse,
  ChatCompletionOptions,
  ParsedResponse,
  ResponseFormat,
} from "./openrouter.types";
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
import {
  DEFAULT_MODEL,
  DEFAULT_MODEL_PARAMETERS,
  RETRY_CONFIG,
  REQUEST_TIMEOUT,
  OPENROUTER_API_URL,
  validateModelParameters,
} from "./config";

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
    this.apiUrl = options?.apiUrl || OPENROUTER_API_URL;
    this.defaultModel = options?.defaultModel || DEFAULT_MODEL;
    this.timeout = options?.timeout || REQUEST_TIMEOUT;
    this.maxRetries = options?.maxRetries || RETRY_CONFIG.MAX_RETRIES;
    this.retryDelay = RETRY_CONFIG.INITIAL_DELAY;
    this.retryMultiplier = RETRY_CONFIG.BACKOFF_FACTOR;
  }

  /**
   * Wysyła zapytanie do modelu LLM i zwraca odpowiedź
   *
   * @param options - Opcje zapytania
   * @returns Parsowana odpowiedź z modelu
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Generic response type
  async chatCompletion<T = any>(options: ChatCompletionOptions): Promise<ParsedResponse<T>> {
    // Buduj wiadomości
    const messages = this.buildMessages(options.userMessage, options.systemPrompt, options.conversationHistory);

    // Waliduj parametry
    if (options.parameters) {
      validateModelParameters(options.parameters);
    }

    // Przygotuj request
    const request: OpenRouterRequest = {
      model: options.model || this.defaultModel,
      messages,
      temperature: options.parameters?.temperature ?? DEFAULT_MODEL_PARAMETERS.temperature,
      max_tokens: options.parameters?.max_tokens ?? DEFAULT_MODEL_PARAMETERS.max_tokens,
      top_p: options.parameters?.top_p,
      frequency_penalty: options.parameters?.frequency_penalty,
      presence_penalty: options.parameters?.presence_penalty,
      response_format: options.responseFormat,
      stop: options.parameters?.stop,
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
  async simpleChat(userMessage: string, systemPrompt?: string, model?: string): Promise<string> {
    const response = await this.chatCompletion({
      userMessage,
      systemPrompt,
      model,
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
      model,
    });

    if (!response.data) {
      throw new ParseError("Expected structured data but got none");
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
      model,
    });

    // Aktualizuj historię
    const updatedHistory = [
      ...conversationHistory,
      { role: "user" as const, content: userMessage },
      { role: "assistant" as const, content: result.content },
    ];

    return {
      response: result.content,
      updatedHistory,
    };
  }

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
      throw new Error("Timeout must be positive");
    }
    this.timeout = timeout;
  }

  /**
   * Buduje tablicę wiadomości dla API
   */
  private buildMessages(userMessage: string, systemPrompt?: string, conversationHistory?: Message[]): Message[] {
    const messages: Message[] = [];

    // Dodaj system prompt jeśli istnieje
    if (systemPrompt) {
      messages.push({
        role: "system",
        content: systemPrompt,
      });
    }

    // Dodaj historię konwersacji jeśli istnieje
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }

    // Dodaj aktualną wiadomość użytkownika
    messages.push({
      role: "user",
      content: userMessage,
    });

    return messages;
  }

  /**
   * Wysyła request do API z obsługą retry
   */
  private async sendRequestWithRetry(request: OpenRouterRequest, attempt = 0): Promise<OpenRouterResponse> {
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
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "",
          "X-Title": "Simple Calories App",
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Obsługa błędów HTTP
      if (!response.ok) {
        await this.handleHttpError(response);
      }

      const data = await response.json();
      return data as OpenRouterResponse;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Generic error handling
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
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

      case 429: {
        const retryAfter = response.headers.get("Retry-After");
        throw new RateLimitError(errorMessage, retryAfter ? parseInt(retryAfter, 10) : undefined);
      }

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
  private parseResponse<T>(response: OpenRouterResponse, responseFormat?: ResponseFormat): ParsedResponse<T> {
    const choice = response.choices[0];
    if (!choice) {
      throw new ParseError("No choices in response");
    }

    const content = choice.message.content;
    let parsedData: T | undefined;

    // Jeśli oczekujemy JSON, sparsuj go
    if (responseFormat) {
      try {
        parsedData = JSON.parse(content) as T;
      } catch {
        throw new ParseError("Failed to parse JSON response", content);
      }
    }

    return {
      content,
      data: parsedData,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      },
    };
  }

  /**
   * Sprawdza czy należy ponowić próbę
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Generic error check
  private shouldRetry(error: any, attempt: number): boolean {
    if (attempt >= this.maxRetries) {
      return false;
    }

    // Retry tylko dla określonych błędów
    return error instanceof RateLimitError || error instanceof ServerError || error instanceof TimeoutError;
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
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
