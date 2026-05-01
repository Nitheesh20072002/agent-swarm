
import { Request, Response, NextFunction } from 'express';
import { ConversationService } from '../services/ConversationService';
import { AuthRequest } from '../middleware/auth';

/**
 * Conversation Controller
 * Handles HTTP requests for conversation operations
 */
export class ConversationController {
  private conversationService: ConversationService;

  constructor() {
    this.conversationService = new ConversationService();
  }

  /**
   * Create a new conversation
   * POST /api/conversations
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { agentId, title } = req.body;
      const userId = req.user!.userId;

      const conversation = await this.conversationService.createConversation({
        userId,
        agentId,
        title,
      });

      // Transform conversation to match frontend expectations
      const transformedConversation = {
        id: conversation.id,
        userId: conversation.userId,
        name: conversation.title, // Frontend expects 'name', backend has 'title'
        type: 'direct' as const, // All current conversations are direct (one-on-one with agent)
        participants: [conversation.agentId], // Frontend expects array of participant IDs
        lastMessageAt: conversation.updatedAt,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      };

      res.status(201).json({
        success: true,
        data: { conversation: transformedConversation },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all conversations for the authenticated user
   * GET /api/conversations
   */
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;

      const conversations = await this.conversationService.getUserConversations(userId);

      // Transform conversations to match frontend expectations
      const transformedConversations = conversations.map(conv => ({
        id: conv.id,
        userId: conv.userId,
        name: conv.title, // Frontend expects 'name', backend has 'title'
        type: 'direct' as const, // All current conversations are direct (one-on-one with agent)
        participants: [conv.agentId], // Frontend expects array of participant IDs
        lastMessageAt: conv.updatedAt,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      }));

      res.json({
        success: true,
        data: { conversations: transformedConversations },
        count: transformedConversations.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a specific conversation with messages
   * GET /api/conversations/:id
   */
  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const conversation = await this.conversationService.getConversationById(id, userId);

      res.json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a conversation
   * PATCH /api/conversations/:id
   */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const { title, status } = req.body;

      const conversation = await this.conversationService.updateConversation(
        id,
        userId,
        { title, status }
      );

      res.json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a conversation
   * DELETE /api/conversations/:id
   */
  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      await this.conversationService.deleteConversation(id, userId);

      res.json({
        success: true,
        message: 'Conversation deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Archive a conversation
   * POST /api/conversations/:id/archive
   */
  archive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const conversation = await this.conversationService.archiveConversation(id, userId);

      res.json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Send a message in a conversation
   * POST /api/conversations/:id/messages
   */
  sendMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id: conversationId } = req.params;
      const { content } = req.body;
      const userId = req.user!.userId;

      const message = await this.conversationService.sendMessage({
        conversationId,
        userId,
        content,
        role: 'user',
      });

      // Transform message to match frontend expectations
      const transformedMessage = {
        id: message.id,
        conversationId: message.conversationId,
        senderId: userId,
        senderType: message.role, // Map 'role' to 'senderType'
        content: message.content,
        isRead: false,
        createdAt: message.createdAt,
        updatedAt: message.createdAt,
      };

      res.status(201).json({
        success: true,
        data: { message: transformedMessage },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get messages for a conversation
   * GET /api/conversations/:id/messages
   */
  getMessages = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id: conversationId } = req.params;
      const userId = req.user!.userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const messages = await this.conversationService.getMessages(
        conversationId,
        userId,
        { limit, offset }
      );

      // Get conversation to access agentId for proper message transformation
      const conversation = await this.conversationService.getConversationById(conversationId, userId);

      // Transform messages to match frontend expectations
      const transformedMessages = messages.map(msg => ({
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.role === 'user' ? userId : conversation.agentId, // Use userId for user, agentId for agent
        senderType: msg.role, // Map 'role' to 'senderType'
        content: msg.content,
        isRead: false,
        createdAt: msg.createdAt,
        updatedAt: msg.createdAt,
      }));

      res.json({
        success: true,
        data: {
          messages: transformedMessages,
        },
        count: transformedMessages.length,
        pagination: {
          limit,
          offset,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
