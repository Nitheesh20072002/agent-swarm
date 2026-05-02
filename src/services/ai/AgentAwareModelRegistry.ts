
/**
 * Agent-Aware Model Registry
 * Uses per-agent API keys when available, falls back to system key
 */

import { AIModelService, GenerateParams, GenerateResponse } from './types';
import { OpenRouterProvider } from './providers/OpenRouterProvider';
import { logger } from '../../utils/logger';

export class AgentAwareModelRegistry {
  private systemProvider: OpenRouterProvider | null = null;
  private agentProviders: Map<string, OpenRouterProvider> = new Map();
  private modelProviderMap: Map<string, string>;

  constructor() {
    this.modelProviderMap = new Map();
    this.initializeSystemProvider();
    this.mapOpenRouterModels();
  }

  /**
   * Initialize system-level provider (fallback)
   */
  private initializeSystemProvider(): void {
    const openrouterApiKey = process.env.OPENROUTER_API_KEY;
    
    if (openrouterApiKey) {
      this.systemProvider = new OpenRouterProvider({
        apiKey: openrouterApiKey,
        appName: process.env.OPENROUTER_APP_NAME || 'ai-agent-swarm',
        siteUrl: process.env.OPENROUTER_SITE_URL || 'http://localhost:3000',
      });
      
      logger.info('System OpenRouter provider initialized');
    } else {
      logger.warn('No system OpenRouter API key - will require per-agent keys');
    }
  }

  /**
   * Map OpenRouter model names to the provider
   */
  private mapOpenRouterModels(): void {
    const openRouterModels = [
      // Free models
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
   * Get or create provider for a specific agent
   */
  private getProviderForAgent(agentApiKey?: string): OpenRouterProvider {
    // If agent has their own API key, use it
    if (agentApiKey) {
      // Cache per-agent providers to reuse
      if (!this.agentProviders.has(agentApiKey)) {
        const provider = new OpenRouterProvider({
          apiKey: agentApiKey,
          appName: process.env.OPENROUTER_APP_NAME || 'ai-agent-swarm',
          siteUrl: process.env.OPENROUTER_SITE_URL || 'http://localhost:3000',
        });
        
        this.agentProviders.set(agentApiKey, provider);
        logger.debug('Created provider for agent with custom API key');
      }
      
      return this.agentProviders.get(agentApiKey)!;
    }

    // Fall back to system provider
    if (!this.systemProvider) {
      throw new Error(
        'No API key available. Either provide a system-level OPENROUTER_API_KEY ' +
        'or configure an API key for this agent.'
      );
    }

    return this.systemProvider;
  }

  /**
   * Generate response using agent-specific or system provider
   */
  async generateResponse(
    params: GenerateParams,
    agentApiKey?: string
  ): Promise<GenerateResponse> {
    const provider = this.getProviderForAgent(agentApiKey);
    
    if (agentApiKey) {
      logger.debug('Using agent-specific API key for generation');
    } else {
      logger.debug('Using system API key for generation');
    }
    
    return provider.generateResponse(params);
  }

  /**
   * Check if a model is supported
   */
  isModelSupported(modelName: string): boolean {
    return this.modelProviderMap.has(modelName) || modelName.includes('/');
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
   * Test system provider connection
   */
  async testSystemConnection(): Promise<boolean> {
    if (!this.systemProvider) {
      return false;
    }

    try {
      await this.systemProvider.generateResponse({
        model: this.getDefaultModel(),
        messages: [{ role: 'user', content: 'test' }],
        maxTokens: 10,
      });
      return true;
    } catch (error) {
      logger.error('System provider connection test failed', { error });
      return false;
    }
  }
}

// Export singleton instance
export const agentAwareModelRegistry = new AgentAwareModelRegistry();
