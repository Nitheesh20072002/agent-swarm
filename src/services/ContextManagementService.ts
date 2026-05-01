
import { pool } from '../database/client';
import { logger } from '../utils/logger';
import { ChatMessage } from './ai/types';
import { modelRegistry } from './ai/ModelRegistry';
import { modelRegistryEnhanced } from './ai/ModelRegistryEnhanced';
import { retryWithBackoff } from '../utils/retry';
import { contextCache } from '../utils/cache';

// Use enhanced registry with fallback support
const aiRegistry = process.env.USE_ENHANCED_REGISTRY === 'true'
  ? modelRegistryEnhanced
  : modelRegistry;

export interface ConversationContext {
  id: string;
  conversationId: string;
  contextMessages: ContextMessage[];
  totalTokens: number;
  maxTokens: number;
  summary: string | null;
  isCompressed: boolean;
  lastCompressedAt: Date | null;
  compressionRatio: number | null;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContextMessage {
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  tokens?: number;
}

export interface AddMessageOptions {
  estimateTokens?: boolean;
  autoCompress?: boolean;
}

export interface CompressOptions {
  targetTokens?: number;
  keepRecentMessages?: number;
  model?: string;
}

/**
 * Context Management Service
 * Handles conversation context storage, retrieval, and compression
 */
export class ContextManagementService {
  // Default configuration
  private readonly DEFAULT_MAX_TOKENS = 4000;
  private readonly COMPRESSION_THRESHOLD = 0.8; // Compress at 80% capacity
  private readonly KEEP_RECENT_MESSAGES = 10; // Always keep last N messages uncompressed
  private readonly TOKEN_ESTIMATION_RATIO = 0.25; // ~4 chars per token

  /**
   * Get conversation context from database (with caching)
   */
  async getConversationContext(conversationId: string): Promise<ConversationContext | null> {
    // Check cache first
    const cacheKey = `context:${conversationId}`;
    const cached = contextCache.get(cacheKey);
    
    if (cached !== null) {
      logger.debug('Context cache hit', { conversationId });
      return cached;
    }

    const query = `
      SELECT
        id,
        conversation_id as "conversationId",
        context_messages as "contextMessages",
        total_tokens as "totalTokens",
        max_tokens as "maxTokens",
        summary,
        is_compressed as "isCompressed",
        last_compressed_at as "lastCompressedAt",
        compression_ratio as "compressionRatio",
        metadata,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM conversation_contexts
      WHERE conversation_id = $1
    `;

    try {
      const result = await pool.query(query, [conversationId]);
      const context = result.rows[0] || null;
      
      // Cache the result
      if (context) {
        contextCache.set(cacheKey, context, 300); // Cache for 5 minutes
      }
      
      return context;
    } catch (error) {
      logger.error('Error getting conversation context', { error, conversationId });
      throw error;
    }
  }

  /**
   * Get stored context or create new one
   */
  async getStoredContext(conversationId: string): Promise<ConversationContext> {
    let context = await this.getConversationContext(conversationId);
    
    if (!context) {
      // Context should be auto-created by trigger, but create if missing
      context = await this.createContext(conversationId);
    }
    
    return context;
  }

  /**
   * Create a new context entry
   */
  private async createContext(conversationId: string): Promise<ConversationContext> {
    const query = `
      INSERT INTO conversation_contexts (conversation_id, max_tokens)
      VALUES ($1, $2)
      RETURNING 
        id,
        conversation_id as "conversationId",
        context_messages as "contextMessages",
        total_tokens as "totalTokens",
        max_tokens as "maxTokens",
        summary,
        is_compressed as "isCompressed",
        last_compressed_at as "lastCompressedAt",
        compression_ratio as "compressionRatio",
        metadata,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    try {
      const result = await pool.query(query, [conversationId, this.DEFAULT_MAX_TOKENS]);
      logger.info('Context created', { conversationId });
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating context', { error, conversationId });
      throw error;
    }
  }

  /**
   * Add a message to the conversation context
   */
  async addMessageToContext(
    conversationId: string,
    message: Omit<ContextMessage, 'timestamp'>,
    options: AddMessageOptions = {}
  ): Promise<ConversationContext> {
    const { estimateTokens = true, autoCompress = true } = options;

    // Get current context
    const context = await this.getStoredContext(conversationId);

    // Prepare message with timestamp
    const contextMessage: ContextMessage = {
      ...message,
      timestamp: new Date().toISOString(),
      tokens: estimateTokens ? this.estimateTokens(message.content) : undefined,
    };

    // Add message to context
    const updatedMessages = [...context.contextMessages, contextMessage];
    const newTokenCount = this.calculateTotalTokens(updatedMessages, context.summary);

    // Check if compression is needed
    const needsCompression = autoCompress && 
      newTokenCount > context.maxTokens * this.COMPRESSION_THRESHOLD &&
      !context.isCompressed;

    if (needsCompression) {
      logger.info('Context approaching limit, compressing', {
        conversationId,
        currentTokens: newTokenCount,
        maxTokens: context.maxTokens,
      });
      return await this.compressContext(conversationId, { keepRecentMessages: this.KEEP_RECENT_MESSAGES });
    }

    // Update context
    return await this.storeContext(conversationId, {
      contextMessages: updatedMessages,
      totalTokens: newTokenCount,
    });
  }

  /**
   * Store/update conversation context (invalidates cache)
   */
  async storeContext(
    conversationId: string,
    updates: {
      contextMessages?: ContextMessage[];
      totalTokens?: number;
      summary?: string;
      isCompressed?: boolean;
      compressionRatio?: number;
      metadata?: any;
    }
  ): Promise<ConversationContext> {
    // Invalidate cache
    const cacheKey = `context:${conversationId}`;
    contextCache.delete(cacheKey);
    
    const query = `
      UPDATE conversation_contexts
      SET 
        context_messages = COALESCE($2, context_messages),
        total_tokens = COALESCE($3, total_tokens),
        summary = COALESCE($4, summary),
        is_compressed = COALESCE($5, is_compressed),
        compression_ratio = COALESCE($6, compression_ratio),
        metadata = COALESCE($7, metadata),
        updated_at = CURRENT_TIMESTAMP
      WHERE conversation_id = $1
      RETURNING 
        id,
        conversation_id as "conversationId",
        context_messages as "contextMessages",
        total_tokens as "totalTokens",
        max_tokens as "maxTokens",
        summary,
        is_compressed as "isCompressed",
        last_compressed_at as "lastCompressedAt",
        compression_ratio as "compressionRatio",
        metadata,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    try {
      const result = await pool.query(query, [
        conversationId,
        updates.contextMessages ? JSON.stringify(updates.contextMessages) : undefined,
        updates.totalTokens !== undefined ? updates.totalTokens : undefined,
        updates.summary !== undefined ? updates.summary : undefined,
        updates.isCompressed !== undefined ? updates.isCompressed : undefined,
        updates.compressionRatio !== undefined ? updates.compressionRatio : undefined,
        updates.metadata ? JSON.stringify(updates.metadata) : undefined,
      ]);

      const updatedContext = result.rows[0];
      
      // Update cache with new value
      contextCache.set(cacheKey, updatedContext, 300);
      
      logger.debug('Context updated', {
        conversationId,
        totalTokens: updates.totalTokens,
        messagesCount: updates.contextMessages?.length,
      });

      return updatedContext;
    } catch (error) {
      logger.error('Error storing context', { error, conversationId });
      throw error;
    }
  }

  /**
   * Rebuild context from conversation messages
   */
  async rebuildContext(conversationId: string, messageLimit: number = 20): Promise<ConversationContext> {
    // Get recent messages from database
    const query = `
      SELECT 
        role,
        content,
        created_at as "createdAt"
      FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    try {
      const result = await pool.query(query, [conversationId, messageLimit]);
      const messages = result.rows.reverse(); // Oldest first

      // Convert to context messages
      const contextMessages: ContextMessage[] = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.createdAt.toISOString(),
        tokens: this.estimateTokens(msg.content),
      }));

      const totalTokens = this.calculateTotalTokens(contextMessages);

      // Store rebuilt context
      return await this.storeContext(conversationId, {
        contextMessages,
        totalTokens,
        isCompressed: false,
        summary: undefined,
      });
    } catch (error) {
      logger.error('Error rebuilding context', { error, conversationId });
      throw error;
    }
  }

  /**
   * Compress context by summarizing old messages
   */
  async compressContext(
    conversationId: string,
    options: CompressOptions = {}
  ): Promise<ConversationContext> {
    const {
      targetTokens,
      keepRecentMessages = this.KEEP_RECENT_MESSAGES,
      model = 'liquid/lfm-2.5-1.2b-instruct:free',
    } = options;

    const context = await this.getStoredContext(conversationId);
    const messages = context.contextMessages;

    if (messages.length <= keepRecentMessages) {
      logger.info('Not enough messages to compress', {
        conversationId,
        messageCount: messages.length,
        keepRecent: keepRecentMessages,
      });
      return context;
    }

    // Split messages: old (to summarize) and recent (to keep)
    const oldMessages = messages.slice(0, -keepRecentMessages);
    const recentMessages = messages.slice(-keepRecentMessages);

    // Generate summary of old messages
    const summary = await this.summarizeMessages(oldMessages, model);
    const summaryTokens = this.estimateTokens(summary);

    // Calculate new token count
    const recentTokens = this.calculateTotalTokens(recentMessages);
    const newTotalTokens = summaryTokens + recentTokens;
    const originalTokens = context.totalTokens;
    const compressionRatio = newTotalTokens / originalTokens;

    // Store compressed context
    const compressedContext = await this.storeContext(conversationId, {
      contextMessages: recentMessages,
      totalTokens: newTotalTokens,
      summary,
      isCompressed: true,
      compressionRatio,
    });

    // Update compression timestamp
    await pool.query(
      'UPDATE conversation_contexts SET last_compressed_at = CURRENT_TIMESTAMP WHERE conversation_id = $1',
      [conversationId]
    );

    logger.info('Context compressed', {
      conversationId,
      originalTokens,
      newTokens: newTotalTokens,
      compressionRatio: compressionRatio.toFixed(2),
      oldMessagesCount: oldMessages.length,
      recentMessagesCount: recentMessages.length,
    });

    return compressedContext;
  }

  /**
   * Summarize a list of messages using AI
   */
  private async summarizeMessages(messages: ContextMessage[], model: string): Promise<string> {
    // Build conversation text
    const conversationText = messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    // Create summarization prompt
    const chatMessages: ChatMessage[] = [
      {
        role: 'user',
        content: `Summarize the following conversation concisely, preserving key information and context:\n\n${conversationText}`,
      },
    ];

    try {
      // Use retry logic for AI summarization
      const response = await retryWithBackoff(
        () => aiRegistry.generateResponse({
          model,
          messages: chatMessages,
          temperature: 0.3, // Lower temperature for more focused summary
          maxTokens: 500,
          systemPrompt: 'You are a helpful assistant that creates concise summaries of conversations.',
        }),
        {
          maxAttempts: 3,
          initialDelayMs: 1000,
          maxDelayMs: 5000,
        },
        'Context summarization'
      );

      return response.content;
    } catch (error: any) {
      logger.error('Error summarizing messages', {
        error: error.message,
        messageCount: messages.length,
        model,
      });
      
      // Fallback: create simple text summary without AI
      const fallbackSummary = this.createFallbackSummary(messages, conversationText);
      
      logger.info('Using fallback summary method', {
        messageCount: messages.length,
        summaryLength: fallbackSummary.length,
      });
      
      return fallbackSummary;
    }
  }

  /**
   * Get context for AI model (includes summary if compressed)
   */
  async getContextForAI(conversationId: string): Promise<ChatMessage[]> {
    const context = await this.getStoredContext(conversationId);
    const aiMessages: ChatMessage[] = [];

    // Add summary as system message if context is compressed
    if (context.isCompressed && context.summary) {
      aiMessages.push({
        role: 'system',
        content: `Previous conversation summary: ${context.summary}`,
      });
    }

    // Add recent messages
    for (const msg of context.contextMessages) {
      aiMessages.push({
        role: msg.role === 'agent' ? 'assistant' : msg.role === 'system' ? 'system' : 'user',
        content: msg.content,
      });
    }

    return aiMessages;
  }

  /**
   * Estimate token count for text (simple heuristic: ~4 chars per token)
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length * this.TOKEN_ESTIMATION_RATIO);
  }

  /**
   * Calculate total tokens for messages and optional summary
   */
  private calculateTotalTokens(messages: ContextMessage[], summary?: string | null): number {
    let total = 0;

    // Add summary tokens if present
    if (summary) {
      total += this.estimateTokens(summary);
    }

    // Add message tokens
    for (const msg of messages) {
      if (msg.tokens) {
        total += msg.tokens;
      } else {
        total += this.estimateTokens(msg.content);
      }
    }

    return total;
  }

  /**
   * Clear context for a conversation (invalidates cache)
   */
  async clearContext(conversationId: string): Promise<void> {
    // Invalidate cache
    const cacheKey = `context:${conversationId}`;
    contextCache.delete(cacheKey);
    
    const query = `
      UPDATE conversation_contexts
      SET 
        context_messages = '[]'::jsonb,
        total_tokens = 0,
        summary = NULL,
        is_compressed = false,
        compression_ratio = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE conversation_id = $1
    `;

    try {
      await pool.query(query, [conversationId]);
      logger.info('Context cleared', { conversationId });
    } catch (error) {
      logger.error('Error clearing context', { error, conversationId });
      throw error;
    }
  }

  /**
   * Create fallback summary without AI
   */
  private createFallbackSummary(messages: ContextMessage[], conversationText: string): string {
    const messageCount = messages.length;
    const totalLength = conversationText.length;
    
    // Extract key information
    const roles = messages.map(m => m.role);
    const userMessageCount = roles.filter(r => r === 'user').length;
    const agentMessageCount = roles.filter(r => r === 'agent').length;
    
    // Create structured summary
    const summary = [
      `[Summary of ${messageCount} messages]`,
      `User messages: ${userMessageCount}, Agent responses: ${agentMessageCount}`,
      `Recent exchange: ${conversationText.substring(Math.max(0, totalLength - 300))}`,
    ].join('\n');
    
    return summary;
  }

  /**
   * Get context statistics
   */
  async getContextStats(conversationId: string): Promise<{
    messageCount: number;
    totalTokens: number;
    maxTokens: number;
    usagePercent: number;
    isCompressed: boolean;
    compressionRatio: number | null;
  }> {
    const context = await this.getStoredContext(conversationId);

    return {
      messageCount: context.contextMessages.length,
      totalTokens: context.totalTokens,
      maxTokens: context.maxTokens,
      usagePercent: (context.totalTokens / context.maxTokens) * 100,
      isCompressed: context.isCompressed,
      compressionRatio: context.compressionRatio,
    };
  }
}

// Export singleton instance
export const contextManagementService = new ContextManagementService();
