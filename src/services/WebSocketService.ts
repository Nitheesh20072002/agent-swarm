
import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';
import { ConversationService } from './ConversationService';

interface AuthToken {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

interface SocketWithAuth extends Socket {
  userId?: string;
  email?: string;
}

interface MessagePayload {
  conversationId: string;
  content: string;
  role: 'user' | 'agent';
}

interface JoinConversationPayload {
  conversationId: string;
}

interface AgentStatusUpdate {
  agentId: string;
  status: 'idle' | 'busy' | 'offline';
  currentTask?: string;
}

/**
 * WebSocket Service
 * Handles real-time communication via Socket.io
 */
export class WebSocketService {
  private io: Server;
  private conversationService: ConversationService;
  private userSockets: Map<string, string>; // userId -> socketId
  private agentSockets: Map<string, string>; // agentId -> socketId

  constructor(server: HTTPServer) {
    // Initialize Socket.io with CORS
    this.io = new Server(server, {
      cors: {
        origin: config.cors.origins,
        credentials: true,
        methods: ['GET', 'POST'],
      },
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });

    this.conversationService = new ConversationService();
    this.userSockets = new Map();
    this.agentSockets = new Map();

    this.setupMiddleware();
    this.setupEventHandlers();

    logger.info('WebSocket service initialized');
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware(): void {
    this.io.use(async (socket: SocketWithAuth, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, config.jwt.secret) as AuthToken;

        // Attach user info to socket
        socket.userId = decoded.userId;
        socket.email = decoded.email;

        logger.info('Socket authenticated', {
          socketId: socket.id,
          userId: decoded.userId,
          email: decoded.email,
        });

        next();
      } catch (error) {
        logger.error('Socket authentication failed', { error });
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: SocketWithAuth) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Handle new socket connection
   */
  private handleConnection(socket: SocketWithAuth): void {
    const userId = socket.userId!;

    logger.info('Client connected', {
      socketId: socket.id,
      userId,
      email: socket.email,
    });

    // Store user socket mapping
    this.userSockets.set(userId, socket.id);

    // Send connection success
    socket.emit('connected', {
      socketId: socket.id,
      userId,
      timestamp: new Date().toISOString(),
    });

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Handle joining conversation rooms
    socket.on('join:conversation', (payload: JoinConversationPayload) => {
      this.handleJoinConversation(socket, payload);
    });

    // Handle leaving conversation rooms
    socket.on('leave:conversation', (payload: JoinConversationPayload) => {
      this.handleLeaveConversation(socket, payload);
    });

    // Handle sending messages
    socket.on('message:send', (payload: MessagePayload) => {
      this.handleSendMessage(socket, payload);
    });

    // Handle typing indicators
    socket.on('typing:start', (payload: { conversationId: string }) => {
      this.handleTypingStart(socket, payload);
    });

    socket.on('typing:stop', (payload: { conversationId: string }) => {
      this.handleTypingStop(socket, payload);
    });

    // Handle agent status updates (for agent connections)
    socket.on('agent:status', (payload: AgentStatusUpdate) => {
      this.handleAgentStatus(socket, payload);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('Socket error', {
        socketId: socket.id,
        userId,
        error,
      });
    });
  }

  /**
   * Handle joining a conversation room
   */
  private async handleJoinConversation(
    socket: SocketWithAuth,
    payload: JoinConversationPayload
  ): Promise<void> {
    try {
      const { conversationId } = payload;
      const userId = socket.userId!;

      // Verify user has access to this conversation
      const conversation = await this.conversationService.getConversationById(
        conversationId,
        userId
      );

      // Join conversation room
      socket.join(`conversation:${conversationId}`);

      logger.info('User joined conversation', {
        userId,
        conversationId,
        socketId: socket.id,
      });

      socket.emit('conversation:joined', {
        conversationId,
        timestamp: new Date().toISOString(),
      });

      // Notify others in the conversation
      socket.to(`conversation:${conversationId}`).emit('user:joined', {
        userId,
        conversationId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error joining conversation', {
        error,
        userId: socket.userId,
        payload,
      });

      socket.emit('error', {
        event: 'join:conversation',
        message: 'Failed to join conversation',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle leaving a conversation room
   */
  private handleLeaveConversation(
    socket: SocketWithAuth,
    payload: JoinConversationPayload
  ): void {
    const { conversationId } = payload;
    const userId = socket.userId!;

    socket.leave(`conversation:${conversationId}`);

    logger.info('User left conversation', {
      userId,
      conversationId,
      socketId: socket.id,
    });

    // Notify others in the conversation
    socket.to(`conversation:${conversationId}`).emit('user:left', {
      userId,
      conversationId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle sending a message
   */
  private async handleSendMessage(
    socket: SocketWithAuth,
    payload: MessagePayload
  ): Promise<void> {
    try {
      const { conversationId, content, role } = payload;
      const userId = socket.userId!;

      // Save message to database
      const message = await this.conversationService.sendMessage({
        conversationId,
        userId,
        content,
        role,
      });

      logger.info('Message sent via WebSocket', {
        messageId: message.id,
        conversationId,
        userId,
        role,
      });

      // Emit to conversation room
      this.io.to(`conversation:${conversationId}`).emit('message:new', {
        message: {
          id: message.id,
          conversationId: message.conversationId,
          role: message.role,
          content: message.content,
          createdAt: message.createdAt,
        },
        timestamp: new Date().toISOString(),
      });

      // TODO: If role is 'user', trigger agent processing
      // This will be implemented when we add the Python agent daemon

    } catch (error) {
      logger.error('Error sending message', {
        error,
        userId: socket.userId,
        payload,
      });

      socket.emit('error', {
        event: 'message:send',
        message: 'Failed to send message',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle typing start indicator
   */
  private handleTypingStart(
    socket: SocketWithAuth,
    payload: { conversationId: string }
  ): void {
    const { conversationId } = payload;
    const userId = socket.userId!;

    socket.to(`conversation:${conversationId}`).emit('typing:start', {
      userId,
      conversationId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle typing stop indicator
   */
  private handleTypingStop(
    socket: SocketWithAuth,
    payload: { conversationId: string }
  ): void {
    const { conversationId } = payload;
    const userId = socket.userId!;

    socket.to(`conversation:${conversationId}`).emit('typing:stop', {
      userId,
      conversationId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle agent status updates
   */
  private handleAgentStatus(
    socket: SocketWithAuth,
    payload: AgentStatusUpdate
  ): void {
    const { agentId, status, currentTask } = payload;

    // Store agent socket mapping
    this.agentSockets.set(agentId, socket.id);

    logger.info('Agent status updated', {
      agentId,
      status,
      currentTask,
      socketId: socket.id,
    });

    // Broadcast to all users who have conversations with this agent
    this.io.emit('agent:status', {
      agentId,
      status,
      currentTask,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle disconnection
   */
  private handleDisconnection(socket: SocketWithAuth): void {
    const userId = socket.userId!;

    logger.info('Client disconnected', {
      socketId: socket.id,
      userId,
    });

    // Remove from user socket mapping
    this.userSockets.delete(userId);

    // Remove from agent socket mapping if exists
    for (const [agentId, socketId] of this.agentSockets.entries()) {
      if (socketId === socket.id) {
        this.agentSockets.delete(agentId);
        
        // Broadcast agent offline status
        this.io.emit('agent:status', {
          agentId,
          status: 'offline',
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  /**
   * Send message to specific user
   */
  public sendToUser(userId: string, event: string, data: any): void {
    const socketId = this.userSockets.get(userId);
    
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      logger.debug('Message sent to user', { userId, event });
    } else {
      logger.warn('User socket not found', { userId, event });
    }
  }

  /**
   * Send message to specific conversation
   */
  public sendToConversation(conversationId: string, event: string, data: any): void {
    this.io.to(`conversation:${conversationId}`).emit(event, data);
    logger.debug('Message sent to conversation', { conversationId, event });
  }

  /**
   * Send message to specific agent
   */
  public sendToAgent(agentId: string, event: string, data: any): void {
    const socketId = this.agentSockets.get(agentId);
    
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      logger.debug('Message sent to agent', { agentId, event });
    } else {
      logger.warn('Agent socket not found', { agentId, event });
    }
  }

  /**
   * Broadcast to all connected clients
   */
  public broadcast(event: string, data: any): void {
    this.io.emit(event, data);
    logger.debug('Message broadcasted', { event });
  }

  /**
   * Get Socket.io server instance
   */
  public getIO(): Server {
    return this.io;
  }

  /**
   * Check if user is connected
   */
  public isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  /**
   * Check if agent is connected
   */
  public isAgentConnected(agentId: string): boolean {
    return this.agentSockets.has(agentId);
  }

  /**
   * Get connected users count
   */
  public getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Get connected agents count
   */
  public getConnectedAgentsCount(): number {
    return this.agentSockets.size;
  }
}
