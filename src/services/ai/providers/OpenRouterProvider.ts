/**
 * OpenRouter AI Provider
 * Integrates with OpenRouter API for accessing various AI models
 * Supports free models like Llama, Phi, and Gemma
 */

import axios, { AxiosInstance } from 'axios';
import { AIModelService, GenerateParams, GenerateResponse, ChatMessage } from '../types';
import { logger } from '../../../utils/logger';

export class OpenRouterProvider implements AIModelService {
  private client: AxiosInstance;
  private apiKey: string;
  private appName: string;
  private siteUrl: string;

  constructor(config: {
    apiKey: string;
    appName?: string;
    siteUrl?: string;
  }) {
    this.apiKey = config.apiKey;
    this.appName = config.appName || 'ai-agent-swarm';
    this.siteUrl = config.siteUrl || 'http://localhost:3000';

    // Create axios client with default config
    this.client = axios.create({
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': this.siteUrl,
        'X-Title': this.appName,
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 seconds
    });
  }

  /**
   * Generate a response from the AI model
   */
  async generateResponse(params: GenerateParams): Promise<GenerateResponse> {
    const startTime = Date.now();
    
    try {
      // Build messages array
      const messages = this.buildMessages(params);

      // Make API request
      const response = await this.client.post('/chat/completions', {
        model: params.model,
        messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 2000,
      });

      const duration = Date.now() - startTime;

      // Extract response
      const content = response.data.choices[0]?.message?.content || '';
      const usage = response.data.usage;

      logger.info('OpenRouter response generated', {
        model: params.model,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        totalTokens: usage?.total_tokens,
        duration: `${duration}ms`,
      });

      return {
        content,
        model: params.model,
        usage: usage ? {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        } : undefined,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      logger.error('OpenRouter API error', {
        model: params.model,
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        duration: `${duration}ms`,
      });

      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Invalid OpenRouter API key');
      } else if (error.response?.status === 429) {
        throw new Error('OpenRouter rate limit exceeded');
      } else if (error.response?.status === 402) {
        throw new Error('OpenRouter insufficient credits');
      }

      throw new Error(`OpenRouter API error: ${error.message}`);
    }
  }

  /**
   * Build messages array with system prompt if provided
   */
  private buildMessages(params: GenerateParams): ChatMessage[] {
    const messages: ChatMessage[] = [];

    // Add system prompt if provided
    if (params.systemPrompt) {
      messages.push({
        role: 'system',
        content: params.systemPrompt,
      });
    }

    // Add conversation messages
    messages.push(...params.messages);

    return messages;
  }

  /**
   * Test the API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/models');
      logger.info('OpenRouter connection test successful', {
        modelsCount: response.data.data?.length || 0,
      });
      return true;
    } catch (error: any) {
      logger.error('OpenRouter connection test failed', {
        error: error.message,
        status: error.response?.status,
      });
      return false;
    }
  }

  /**
   * Get available models
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await this.client.get('/models');
      const models = response.data.data || [];
      return models.map((model: any) => model.id);
    } catch (error: any) {
      logger.error('Failed to fetch OpenRouter models', {
        error: error.message,
      });
      return [];
    }
  }
}
