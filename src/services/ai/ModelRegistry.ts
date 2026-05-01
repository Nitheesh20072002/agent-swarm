/**
 * Model Registry
 * Routes AI requests to the appropriate provider based on model name
 */

import { AIModelService, GenerateParams, GenerateResponse } from './types';
import { OpenRouterProvider } from './providers/OpenRouterProvider';
import { logger } from '../../utils/logger';

export class ModelRegistry {
  private providers: Map<string, AIModelService>;
  private modelProviderMap: Map<string, string>;

  constructor() {
    this.providers = new Map();
    this.modelProviderMap = new Map();
    this.initializeProviders();
  }

  /**
   * Initialize all configured providers
   */
  private initializeProviders(): void {
    // Initialize OpenRouter provider
    const openrouterApiKey = process.env.OPENROUTER_API_KEY;
    if (openrouterApiKey) {
      const openRouterProvider = new OpenRouterProvider({
        apiKey: openrouterApiKey,
        appName: process.env.OPENROUTER_APP_NAME || 'ai-agent-swarm',
        siteUrl: process.env.OPENROUTER_SITE_URL || 'http://localhost:3000',
      });
      
      this.providers.set('openrouter', openRouterProvider);
      
      // Map OpenRouter models
      this.mapOpenRouterModels();
      
      logger.info('OpenRouter provider initialized');
    } else {
      logger.warn('OpenRouter API key not found, provider not initialized');
    }

    // TODO: Initialize OpenAI provider when needed
    // TODO: Initialize Anthropic provider when needed

    if (this.providers.size === 0) {
      logger.error('No AI providers initialized! Check your environment variables.');
    }
  }

  /**
   * Map OpenRouter model names to the provider
   */
  private mapOpenRouterModels(): void {
    const openRouterModels = [
      // Free models (verified available as of April 2026)
      'nvidia/nemotron-3-super-120b-a12b:free',
      'qwen/qwen3-next-80b-a3b-instruct:free',
      'google/gemma-4-31b-it:free',
      'google/gemma-4-26b-a4b-it:free',
      'nvidia/nemotron-3-nano-30b-a3b:free',
      'qwen/qwen3-coder:free',
      'openai/gpt-oss-120b:free',
      'liquid/lfm-2.5-1.2b-instruct:free',
      'minimax/minimax-m2.5:free',
      
      // Paid models (if users want to use them)
      'anthropic/claude-opus-4.7',
      'anthropic/claude-sonnet-latest',
      'anthropic/claude-haiku-latest',
      'google/gemini-pro-latest',
      'google/gemini-flash-latest',
      'openai/gpt-4-turbo',
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
    ];

    openRouterModels.forEach(model => {
      this.modelProviderMap.set(model, 'openrouter');
    });
  }

  /**
   * Get the appropriate provider for a model
   */
  getProvider(modelName: string): AIModelService {
    // Check if we have a specific mapping for this model
    const providerName = this.modelProviderMap.get(modelName);
    
    if (providerName) {
      const provider = this.providers.get(providerName);
      if (provider) {
        return provider;
      }
    }

    // Try to detect provider from model name format
    if (modelName.includes('/')) {
      // OpenRouter format: "provider/model-name"
      const provider = this.providers.get('openrouter');
      if (provider) {
        return provider;
      }
    }

    // Fallback to first available provider
    const firstProvider = this.providers.values().next().value;
    if (firstProvider) {
      logger.warn('Using fallback provider for model', { modelName });
      return firstProvider;
    }

    throw new Error('No AI providers available. Please configure at least one provider.');
  }

  /**
   * Generate response using the appropriate provider
   */
  async generateResponse(params: GenerateParams): Promise<GenerateResponse> {
    const provider = this.getProvider(params.model);
    return provider.generateResponse(params);
  }

  /**
   * Check if a model is supported
   */
  isModelSupported(modelName: string): boolean {
    try {
      this.getProvider(modelName);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get list of all supported models
   */
  getSupportedModels(): string[] {
    return Array.from(this.modelProviderMap.keys());
  }

  /**
   * Get default model
   */
  getDefaultModel(): string {
    return process.env.DEFAULT_MODEL || 'liquid/lfm-2.5-1.2b-instruct:free';
  }

  /**
   * Test all configured providers
   */
  async testConnections(): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};

    for (const [name, provider] of this.providers) {
      try {
        // OpenRouter provider has testConnection method
        if ('testConnection' in provider && typeof provider.testConnection === 'function') {
          results[name] = await provider.testConnection();
        } else {
          // For providers without testConnection, try a simple generation
          await provider.generateResponse({
            model: this.getDefaultModel(),
            messages: [{ role: 'user', content: 'test' }],
            maxTokens: 10,
          });
          results[name] = true;
        }
      } catch (error) {
        logger.error(`Provider ${name} connection test failed`, { error });
        results[name] = false;
      }
    }

    return results;
  }
}

// Export singleton instance
export const modelRegistry = new ModelRegistry();
