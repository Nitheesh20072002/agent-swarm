
import { ConversationRepository } from '../repositories/ConversationRepository';
import { AgentService } from './AgentService';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';
import { modelRegistry } from './ai/ModelRegistry';
import { modelRegistryEnhanced } from './ai/ModelRegistryEnhanced';
import { agentAwareModelRegistry } from './ai/AgentAwareModelRegistry';
import { ChatMessage } from './ai/types';
import { contextManagementService } from './ContextManagementService';
import { performanceMonitor } from '../utils/performance';
import { getWebSocketService, hasWebSocketService } from './websocket';

// Use agent-aware registry that supports per-agent API keys
const aiRegistry = agentAwareModelRegistry;

export interface CreateConversationInput {
  userId: string;
  agentId: string;
  title?: string;
}

export interface SendMessageInput {
  conversationId: string;
  userId: string;
  content: string;
  role: 'user' | 'agent';
}

export interface Conversation {
  id: string;
  userId: string;
  agentId: string;
  title: string;
  status: 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  metadata: any;
  createdAt: Date;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
  agent: {
    id: string;
    name: string;
    status: string;
  };
}

/**
 * Conversation Service
 * Handles business logic for conversations and messages
 */
export class ConversationService {
  private conversationRepository: ConversationRepository;
  private agentService: AgentService;

  constructor() {
    this.conversationRepository = new ConversationRepository();
    this.agentService = new AgentService();
  }

  /**
   * Create a new conversation
   */
  async createConversation(input: CreateConversationInput): Promise<Conversation> {
    const { userId, agentId, title } = input;

    // Verify agent exists and user owns it
    const agent = await this.agentService.getAgentById(agentId, userId);

    // Generate title if not provided
    const conversationTitle = title || `Chat with ${agent.name}`;

    // Create conversation
    const conversation = await this.conversationRepository.create({
      userId,
      agentId,
      title: conversationTitle,
      status: 'active',
    });

    logger.info('Conversation created', {
      conversationId: conversation.id,
      userId,
      agentId,
    });

    // Create system welcome message
    const welcomeMessage = await this.conversationRepository.createMessage({
      conversationId: conversation.id,
      role: 'system',
      content: `Started conversation with ${agent.name}`,
      metadata: { agentName: agent.name, agentPersona: agent.persona },
    });

    // Initialize context with welcome message
    await contextManagementService.addMessageToContext(
      conversation.id,
      {
        role: 'system',
        content: welcomeMessage.content,
      },
      { autoCompress: false } // Don't compress on first message
    );

    return conversation;
  }

  /**
   * Get conversation by ID
   */
  async getConversationById(
    conversationId: string,
    userId: string
  ): Promise<ConversationWithMessages> {
    const conversation = await this.conversationRepository.findById(conversationId);

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    // Check ownership
    if (conversation.userId !== userId) {
      throw new ForbiddenError('You do not have access to this conversation');
    }

    // Get messages
    const messages = await this.conversationRepository.findMessagesByConversationId(
      conversationId
    );

    // Get agent info
    const agent = await this.agentService.getAgentById(conversation.agentId, userId);

    return {
      ...conversation,
      messages,
      agent: {
        id: agent.id,
        name: agent.name,
        status: agent.status,
      },
    };
  }

  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId: string): Promise<Conversation[]> {
    const conversations = await this.conversationRepository.findByUserId(userId);
    return conversations;
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(input: SendMessageInput): Promise<Message> {
    const { conversationId, userId, content, role } = input;

    // Verify conversation exists and user owns it
    const conversation = await this.conversationRepository.findById(conversationId);

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenError('You do not have access to this conversation');
    }

    // Validate message content
    if (!content || content.trim().length === 0) {
      throw new BadRequestError('Message content cannot be empty');
    }

    // Create message
    const message = await this.conversationRepository.createMessage({
      conversationId,
      role,
      content: content.trim(),
      metadata: {},
    });

    logger.info('Message sent', {
      messageId: message.id,
      conversationId,
      role,
      contentLength: content.length,
    });

    // Add message to context management
    await contextManagementService.addMessageToContext(
      conversationId,
      {
        role,
        content: content.trim(),
      },
      { estimateTokens: true, autoCompress: true }
    );

    // Update conversation's updated_at timestamp
    await this.conversationRepository.update(conversationId, {
      updatedAt: new Date(),
    });

    // Note: We DON'T broadcast user messages via WebSocket because they're already
    // handled optimistically by the frontend. Only agent/system messages are broadcast.

    // Auto-trigger agent response for user messages
    if (role === 'user') {
      // Process in background to not block HTTP response
      this.processUserMessage(conversationId, message.id, userId)
        .catch(err => {
          logger.error('Error processing user message', {
            error: err.message,
            messageId: message.id,
            conversationId,
          });
        });
    }

    return message;
  }

  /**
   * Process user message and generate agent response
   */
  private async processUserMessage(
    conversationId: string,
    userMessageId: string,
    userId: string
  ): Promise<Message | null> {
    return performanceMonitor.timeAsync(
      'processUserMessage',
      async () => {
        try {
          logger.info('Processing user message for agent response', {
            conversationId,
            userMessageId,
          });

          // Get conversation with agent info
          const conversation = await this.conversationRepository.findById(conversationId);
      if (!conversation) {
        throw new NotFoundError('Conversation not found');
      }

      // Get agent details
      const agent = await this.agentService.getAgentById(conversation.agentId, userId);

      // Get context from Context Management Service with performance tracking
      const promptMessages = await performanceMonitor.timeAsync(
        'getContextForAI',
        () => contextManagementService.getContextForAI(conversationId),
        { conversationId }
      );
      
      // Get context stats for logging
      const contextStats = await contextManagementService.getContextStats(conversationId);
      
      logger.debug('Using conversation context', {
        conversationId,
        messageCount: contextStats.messageCount,
        totalTokens: contextStats.totalTokens,
        usagePercent: contextStats.usagePercent.toFixed(2) + '%',
        isCompressed: contextStats.isCompressed,
      });

      // Select model (use first model from agent's models array)
      const model = agent.models && agent.models.length > 0 
        ? agent.models[0] 
        : modelRegistry.getDefaultModel();

      logger.info('Generating agent response', {
        conversationId,
        agentId: agent.id,
        model,
        contextMessages: promptMessages.length,
      });

      // Broadcast typing indicator
      if (hasWebSocketService()) {
        try {
          const wsService = getWebSocketService();
          wsService.sendToConversation(conversationId, 'typing:start', {
            conversationId,
            timestamp: new Date().toISOString(),
          });
        } catch (wsError) {
          logger.error('Failed to broadcast typing:start', { wsError });
        }
      }

      // Generate response using AI with fallback support and performance tracking
      // Use agent's OpenRouter API key if available, otherwise fall back to system key
      const aiResponse = await performanceMonitor.timeAsync(
        'aiGeneration',
        () => aiRegistry.generateResponse(
          {
            model,
            messages: promptMessages,
            systemPrompt: agent.persona,
            temperature: 0.7,
            maxTokens: 2000,
          },
          agent.openrouterApiKey || undefined
        ),
        { model, conversationId, messageCount: promptMessages.length, usingAgentKey: !!agent.openrouterApiKey }
      );

      // Save agent response
      const agentMessage = await this.conversationRepository.createMessage({
        conversationId,
        role: 'agent',
        content: aiResponse.content,
        metadata: {
          model,
          agentId: agent.id,
          usage: aiResponse.usage,
        },
      });

      // Add agent response to context
      await contextManagementService.addMessageToContext(
        conversationId,
        {
          role: 'agent',
          content: aiResponse.content,
        },
        { estimateTokens: true, autoCompress: true }
      );

      logger.info('Agent response generated', {
        conversationId,
        messageId: agentMessage.id,
        model,
        tokens: aiResponse.usage?.totalTokens,
      });

      // Update conversation timestamp
      await this.conversationRepository.update(conversationId, {
        updatedAt: new Date(),
      });

          // Broadcast agent message via WebSocket for real-time updates
          if (hasWebSocketService()) {
            try {
              const wsService = getWebSocketService();
              
              // Stop typing indicator
              wsService.sendToConversation(conversationId, 'typing:stop', {
                conversationId,
                timestamp: new Date().toISOString(),
              });
              
              // Transform backend message format to match frontend expectations
              wsService.sendToConversation(conversationId, 'message:new', {
                conversationId,
                message: {
                  id: agentMessage.id,
                  conversationId: agentMessage.conversationId,
                  senderId: agentMessage.metadata?.agentId || '',
                  senderType: agentMessage.role, // 'agent' or 'system'
                  content: agentMessage.content,
                  isRead: false,
                  createdAt: agentMessage.createdAt,
                  updatedAt: agentMessage.createdAt,
                },
                timestamp: new Date().toISOString(),
              });
              
              logger.debug('Agent message broadcasted via WebSocket', {
                conversationId,
                messageId: agentMessage.id,
              });
            } catch (wsError) {
              logger.error('Failed to broadcast agent message via WebSocket', {
                error: wsError,
                conversationId,
                messageId: agentMessage.id,
              });
              // Don't fail the request if WebSocket broadcast fails
            }
          }

          return agentMessage;
        } catch (error: any) {
          logger.error('Failed to generate agent response', {
            error: error.message,
            stack: error.stack,
            conversationId,
            userMessageId,
          });

          // Create user-friendly error message
          try {
            let errorContent = 'Sorry, I encountered an error while processing your message.';
            
            // Provide specific error messages for common issues
            if (error.message?.includes('rate limit')) {
              errorContent = 'The AI service is currently experiencing high demand. Please try again in a few moments.';
            } else if (error.message?.includes('API key')) {
              errorContent = 'There is a configuration issue with the AI service. Please contact support.';
            } else if (error.message?.includes('timeout')) {
              errorContent = 'The request took too long to process. Please try again with a shorter message.';
            } else if (error.message?.includes('All models failed')) {
              errorContent = 'All AI models are currently unavailable. Please try again later.';
            }
            
            const errorMessage = await this.conversationRepository.createMessage({
              conversationId,
              role: 'system',
              content: errorContent,
              metadata: {
                error: error.message,
                errorType: error.name,
                userMessageId,
                timestamp: new Date().toISOString(),
              },
            });
            
            // Broadcast error message via WebSocket
            if (hasWebSocketService()) {
              try {
                const wsService = getWebSocketService();
                
                // Stop typing indicator
                wsService.sendToConversation(conversationId, 'typing:stop', {
                  conversationId,
                  timestamp: new Date().toISOString(),
                });
                
                // Transform backend message format to match frontend expectations
                wsService.sendToConversation(conversationId, 'message:new', {
                  conversationId,
                  message: {
                    id: errorMessage.id,
                    conversationId: errorMessage.conversationId,
                    senderId: '',
                    senderType: 'system',
                    content: errorMessage.content,
                    isRead: false,
                    createdAt: errorMessage.createdAt,
                    updatedAt: errorMessage.createdAt,
                  },
                  timestamp: new Date().toISOString(),
                });
              } catch (wsError) {
                logger.error('Failed to broadcast error message via WebSocket', { wsError });
              }
            }
            
            return errorMessage;
          } catch (err) {
            logger.error('Failed to create error message', { error: err });
            return null;
          }
        }
      },
      { conversationId, userMessageId }
    );
  }

  /**
   * Build prompt messages for AI model
   */
  private buildPromptMessages(
    agent: any,
    conversationMessages: Message[]
  ): ChatMessage[] {
    const promptMessages: ChatMessage[] = [];

    // Convert conversation messages to chat format
    // Reverse to get chronological order (oldest first)
    const orderedMessages = [...conversationMessages].reverse();

    for (const msg of orderedMessages) {
      // Skip system messages in the context
      if (msg.role === 'system') continue;

      // Map roles: 'agent' -> 'assistant', 'user' -> 'user'
      const role = msg.role === 'agent' ? 'assistant' : msg.role;
      
      if (role === 'user' || role === 'assistant') {
        promptMessages.push({
          role: role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    return promptMessages;
  }

  /**
   * Get messages for a conversation with pagination
   */
  async getMessages(
    conversationId: string,
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      before?: Date;
    } = {}
  ): Promise<Message[]> {
    // Verify conversation exists and user owns it
    const conversation = await this.conversationRepository.findById(conversationId);

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenError('You do not have access to this conversation');
    }

    // Get messages with pagination
    const messages = await this.conversationRepository.findMessagesByConversationId(
      conversationId,
      {
        limit: options.limit || 50,
        offset: options.offset || 0,
      }
    );

    return messages;
  }

  /**
   * Update conversation
   */
  async updateConversation(
    conversationId: string,
    userId: string,
    updates: {
      title?: string;
      status?: 'active' | 'archived';
    }
  ): Promise<Conversation> {
    // Verify conversation exists and user owns it
    const conversation = await this.conversationRepository.findById(conversationId);

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenError('You do not have access to this conversation');
    }

    // Update conversation
    const updated = await this.conversationRepository.update(conversationId, {
      ...updates,
      updatedAt: new Date(),
    });

    if (!updated) {
      throw new NotFoundError('Conversation not found after update');
    }

    logger.info('Conversation updated', {
      conversationId,
      userId,
      updates,
    });

    return updated;
  }

  /**
   * Delete conversation
   */
  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    // Verify conversation exists and user owns it
    const conversation = await this.conversationRepository.findById(conversationId);

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenError('You do not have access to this conversation');
    }

    // Delete conversation (this will cascade delete messages)
    const deleted = await this.conversationRepository.delete(conversationId);

    if (!deleted) {
      throw new NotFoundError('Conversation not found');
    }

    logger.info('Conversation deleted', { conversationId, userId });
  }

  /**
   * Archive conversation
   */
  async archiveConversation(conversationId: string, userId: string): Promise<Conversation> {
    return this.updateConversation(conversationId, userId, {
      status: 'archived',
    });
  }

  /**
   * Get conversation count for user
   */
  async getUserConversationCount(userId: string): Promise<number> {
    const conversations = await this.conversationRepository.findByUserId(userId);
    return conversations.length;
  }
}
