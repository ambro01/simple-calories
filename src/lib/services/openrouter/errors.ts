// Bazowa klasa błędu OpenRouter
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

// Błąd autoryzacji (401)
export class UnauthorizedError extends OpenRouterError {
  constructor(message = 'Invalid API key') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

// Błąd rate limit (429)
export class RateLimitError extends OpenRouterError {
  constructor(
    message = 'Rate limit exceeded',
    public retryAfter?: number
  ) {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

// Błąd walidacji (400)
export class ValidationError extends OpenRouterError {
  constructor(message: string, public details?: any) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

// Błąd serwera (500+)
export class ServerError extends OpenRouterError {
  constructor(message = 'OpenRouter server error', statusCode = 500) {
    super(message, statusCode);
    this.name = 'ServerError';
  }
}

// Błąd timeout
export class TimeoutError extends OpenRouterError {
  constructor(message = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
  }
}

// Błąd parsowania odpowiedzi
export class ParseError extends OpenRouterError {
  constructor(message = 'Failed to parse response', public rawResponse?: string) {
    super(message);
    this.name = 'ParseError';
  }
}

// Błąd przekroczenia quota
export class QuotaExceededError extends OpenRouterError {
  constructor(message = 'API quota exceeded') {
    super(message, 429);
    this.name = 'QuotaExceededError';
  }
}
