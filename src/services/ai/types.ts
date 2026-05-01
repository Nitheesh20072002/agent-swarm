/**
 * AI Model Service Types
 * Common interfaces for all AI model providers
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerateParams {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface GenerateResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIModelService {
  generateResponse(params: GenerateParams): Promise<GenerateResponse>;
  streamResponse?(params: GenerateParams): AsyncGenerator<string>;
}

export interface ModelConfig {
  provider: 'openrouter' | 'openai' | 'anthropic';
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
}
