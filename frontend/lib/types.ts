// User types
export interface User {
  id: string
  email: string
  username: string
  createdAt: Date
  updatedAt: Date
}

// Agent types
export interface VmConfig {
  host?: string
  port?: number
  username?: string
  sshKey?: string
  password?: string
}

export interface Agent {
  id: string
  userId: string
  name: string
  description: string
  persona: string
  skills: string[]
  permissions: string[]
  vms: string[]
  models: string[]
  openrouterApiKey?: string
  vmConfig?: VmConfig
  status: 'active' | 'inactive' | 'offline'
  isOnline: boolean
  isActive: boolean
  state: string
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

// Conversation types
export interface Conversation {
  id: string
  userId: string
  name: string
  type: 'direct' | 'group'
  participants: string[] // Agent IDs
  lastMessageAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface Message {
  id: string
  conversationId: string
  senderId: string // User or Agent ID
  senderType: 'user' | 'agent' | 'system'
  content: string
  attachments?: string[]
  mentionedAgents?: string[]
  isRead: boolean
  error?: string // Error message if sending failed
  isRetrying?: boolean // Whether message is being retried
  createdAt: Date
  updatedAt: Date
}

// Task types
export interface Task {
  id: string
  userId: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'in_review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignedAgent?: string
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
}

// Scheduled Task types
export interface ScheduledTask {
  id: string
  userId: string
  taskId: string
  agentId: string
  cronExpression: string
  isRecurring: boolean
  isEnabled: boolean
  lastExecutedAt?: Date
  nextExecutionAt?: Date
  createdAt: Date
  updatedAt: Date
}

// Notification types
export interface Notification {
  id: string
  userId: string
  type: 'message' | 'mention' | 'task_assigned' | 'task_updated'
  title: string
  message: string
  referenceId?: string // Message ID, Task ID, etc.
  isRead: boolean
  createdAt: Date
  updatedAt: Date
}

// Push subscription type
export interface PushSubscription {
  id: string
  userId: string
  endpoint: string
  auth: string
  p256dh: string
  createdAt: Date
  updatedAt: Date
}

// Socket.io event types
export interface WebSocketMessage {
  type: 'message' | 'notification' | 'presence' | 'task_update'
  data: any
}

export interface PresenceEvent {
  agentId: string
  status: 'online' | 'offline'
  timestamp: Date
}
