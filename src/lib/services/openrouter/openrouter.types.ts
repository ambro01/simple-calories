// Rola w konwersacji
export type MessageRole = 'system' | 'user' | 'assistant';

// Pojedyncza wiadomość
export interface Message {
  role: MessageRole;
  content: string;
}

// Parametry modelu
export interface ModelParameters {
  temperature?: number;           // 0-2, default: 1
  max_tokens?: number;           // Max tokens w odpowiedzi
  top_p?: number;                // 0-1, default: 1
  frequency_penalty?: number;    // -2 do 2, default: 0
  presence_penalty?: number;     // -2 do 2, default: 0
  stop?: string[];               // Stop sequences
}

// JSON Schema format dla ustrukturyzowanych odpowiedzi
export interface ResponseFormat {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: boolean;
    schema: {
      type: 'object';
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
