
// Common types used across the application

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// User types
export interface UserPayload {
  id: string;
  email: string;
  name?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserPayload;
  token: string;
}

// Agent types
export type AgentPersona = 
  | 'full-stack-developer'
  | 'frontend-developer'
  | 'backend-developer'
  | 'devops-engineer'
  | 'qa-engineer'
  | 'designer'
  | 'product-manager';

export type AgentState = 
  | 'idle'
  | 'working'
  | 'waiting'
  | 'error';

export interface AgentConfig {
  name: string;
  persona: AgentPersona;
  model: string;
  vmConfig?: {
    host: string;
    port: number;
    user: string;
    keyPath: string;
  };
  permissions?: {
    fileSystem?: {
      read?: string[];
      write?: string[];
    };
    git?: {
      allowCommit: boolean;
      allowPush: boolean;
    };
    commands?: {
      allowed?: string[];
      blocked?: string[];
    };
  };
}

export interface CreateAgentRequest {
  name: string;
  persona: AgentPersona;
  model: string;
  metadata?: Record<string, any>;
}

export interface UpdateAgentRequest {
  name?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

// Conversation types
export type MessageRole = 'user' | 'agent' | 'system';

export interface CreateConversationRequest {
  agentId: string;
  title?: string;
}

export interface SendMessageRequest {
  content: string;
  metadata?: Record<string, any>;
}

export interface MessageResponse {
  id: string;
  role: MessageRole;
  content: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface ConversationResponse {
  id: string;
  agentId: string;
  userId: string;
  title?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  messages?: MessageResponse[];
}

// Task types
export type TaskStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed';

export interface CreateTaskRequest {
  agentId: string;
  title: string;
  description: string;
  priority?: number;
}

export interface TaskResponse {
  id: string;
  agentId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: number;
  result?: string;
  errorMsg?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

// Notification types
export type NotificationType = 
  | 'task_started'
  | 'task_completed'
  | 'task_failed'
  | 'error'
  | 'idle_warning'
  | 'agent_message';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface SendNotificationRequest {
  userId: string;
  notification: NotificationPayload;
}

// WebSocket types
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: Date;
}

export interface AgentMessagePayload {
  conversationId: string;
  agentId: string;
  message: string;
  metadata?: Record<string, any>;
}

// Error types
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}
