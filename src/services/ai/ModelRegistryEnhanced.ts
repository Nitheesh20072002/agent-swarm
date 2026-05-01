
/**
 * Enhanced Model Registry with Retry Logic and Fallback Models
 * Routes AI requests to the appropriate provider with automatic failover
 */

import { AIModelService, GenerateParams, GenerateResponse } from './types';
import { OpenRouterProvider } from './providers/OpenRouterProvider';
import { logger } from '../../utils/logger';
import { retryWithBackoff, CircuitBreaker } from '../../utils/retry';

export interface ModelConfig {
  primary: string;
  fallbacks: string[];
  retryAttempts?: number;
}

export class ModelRegistryEnhanced {
  private providers: Map<string, AIModelService>;
  private modelProviderMap: Map<string, string>;
  private circuitBreaker: CircuitBreaker;
  private fallbackModels: Map<string, string[]>;

  constructor() {
    this.providers = new Map();
    this.modelProviderMap = new Map();
    this.circuitBreaker = new CircuitBreaker(5, 60000); // 5 failures, 60s reset
    this.fallbackModels = new Map();
    this.initializeProviders();
    this.initializeFallbackModels();
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
      this.mapOpenRouterModels();
      
      logger.info('OpenRouter provider initialized');
    } else {
      logger.warn('OpenRouter API key not found, provider not initialized');
    }

    if (this.providers.size === 0) {
      logger.error('No AI providers initialized! Check your environment variables.');
    }
  }

  /**
   * Map OpenRouter model names to the provider
   */
  private mapOpenRouterModels(): void {
    const openRouterModels = [
      // Free models (verified available)
      'nvidia/nemotron-3-super-120b-a12b:free',
      'qwen/qwen3-next-80b-a3b-instruct:free',
      'google/gemma-4-31b-it:free',
      'google/gemma-4-26b-a4b-it:free',
      'nvidia/nemotron-3-nano-30b-a3b:free',
      'qwen/qwen3-coder:free',
      'openai/gpt-oss-120b:free',
      'liquid/lfm-2.5-1.2b-instruct:free',
      'minimax/minimax-m2.5:free',
      
      // Paid models
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
   * Initialize fallback models for each tier
   */
  private initializeFallbackModels(): void {
    // Premium models fallback chain
    this.fallbackModels.set('anthropic/claude-opus-4.7', [
      'anthropic/claude-sonnet-latest',
      'anthropic/claude-haiku-latest',
      'google/gemini-pro-latest',
      'liquid/lfm-2.5-1.2b-instruct:free',
    ]);

    this.fallbackModels.set('anthropic/claude-sonnet-latest', [
      'anthropic/claude-haiku-latest',
      'google/gemini-pro-latest',
      'liquid/lfm-2.5-1.2b-instruct:free',
    ]);

    // Free models fallback chain
    this.fallbackModels.set('liquid/lfm-2.5-1.2b-instruct:free', [
      'google/gemma-4-31b-it:free',
      'qwen/qwen3-next-80b-a3b-instruct:free',
      'nvidia/nemotron-3-super-120b-a12b:free',
    ]);

    this.fallbackModels.set('google/gemma-4-31b-it:free', [
      'qwen/qwen3-next-80b-a3b-instruct:free',
      'liquid/lfm-2.5-1.2b-instruct:free',
      'nvidia/nemotron-3-super-120b-a12b:free',
    ]);

    // Coding-specific models
    this.fallbackModels.set('qwen/qwen3-coder:free', [
      'liquid/lfm-2.5-1.2b-instruct:free',
      'google/gemma-4-31b-it:free',
    ]);
  }

  /**
   * Get the appropriate provider for a model
   */
  getProvider(modelName: string): AIModelService {
    const providerName = this.modelProviderMap.get(modelName);
    
    if (providerName) {
      const provider = this.providers.get(providerName);
      if (provider) {
        return provider;
      }
    }

    // Try to detect provider from model name format
    if (modelName.includes('/')) {
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
   * Generate response with automatic retry and fallback
   */
  async generateResponse(params: GenerateParams): Promise<GenerateResponse> {
    const modelChain = this.getModelChain(params.model);
    let lastError: Error | null = null;

    for (const model of modelChain) {
      // Check circuit breaker
      if (this.circuitBreaker.isOpen(model)) {
        logger.warn('Circuit breaker open, skipping model', {
          model,
          failures: this.circuitBreaker.getFailureCount(model),
        });
        continue;
      }

      try {
        const provider = this.getProvider(model);
        const modelParams = { ...params, model };

        // Attempt with retry logic
        const response = await retryWithBackoff(
          () => provider.generateResponse(modelParams),
          {
            maxAttempts: 3,
            initialDelayMs: 1000,
            maxDelayMs: 10000,
          },
          `AI generation with ${model}`
        );

        // Success - reset circuit breaker
        this.circuitBreaker.recordSuccess(model);

        // Log if we used a fallback model
        if (model !== params.model) {
          logger.info('Successfully used fallback model', {
            requestedModel: params.model,
            usedModel: model,
          });
        }

        return response;
      } catch (error: any) {
        lastError = error;
        this.circuitBreaker.recordFailure(model);

        logger.error('Model generation failed', {
          model,
          error: error.message,
          hasMoreFallbacks: modelChain.indexOf(model) < modelChain.length - 1,
        });

        // Continue to next fallback
        continue;
      }
    }

    // All models failed
    throw new Error(
      `All models failed. Last error: ${lastError?.message || 'Unknown error'}`
    );
  }

  /**
   * Get model chain (primary + fallbacks)
   */
  private getModelChain(model: string): string[] {
    const chain = [model];
    const fallbacks = this.fallbackModels.get(model) || [];
    
    // Add fallbacks if configured
    chain.push(...fallbacks);

    // Always add default free model as last resort
    const defaultModel = this.getDefaultModel();
    if (!chain.includes(defaultModel)) {
      chain.push(defaultModel);
    }

    return chain;
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
   * Set fallback models for a primary model
   */
  setFallbackModels(primaryModel: string, fallbacks: string[]): void {
    this.fallbackModels.set(primaryModel, fallbacks);
    logger.info('Fallback models configured', {
      primaryModel,
      fallbackCount: fallbacks.length,
    });
  }

  /**
   * Get circuit breaker status for all models
   */
  getCircuitBreakerStatus(): { [key: string]: { open: boolean; failures: number } } {
    const status: { [key: string]: { open: boolean; failures: number } } = {};
    
    for (const model of this.modelProviderMap.keys()) {
      status[model] = {
        open: this.circuitBreaker.isOpen(model),
        failures: this.circuitBreaker.getFailureCount(model),
      };
    }

    return status;
  }

  /**
   * Test all configured providers
   */
  async testConnections(): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};

    for (const [name, provider] of this.providers) {
      try {
        if ('testConnection' in provider && typeof provider.testConnection === 'function') {
          results[name] = await provider.testConnection();
        } else {
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
export const modelRegistryEnhanced = new ModelRegistryEnhanced();
