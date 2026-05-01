
import { z } from 'zod';

/**
 * Validation schemas using Zod
 * These schemas ensure type-safety and runtime validation
 */

// Auth schemas
export const registerSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email format')
      .toLowerCase()
      .trim(),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-zA-Z]/, 'Password must contain letters')
      .regex(/\d/, 'Password must contain numbers'),
    username: z.string().trim().optional(),
    name: z.string().trim().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email format')
      .toLowerCase()
      .trim(),
    password: z.string({ required_error: 'Password is required' }),
  }),
});

// Agent schemas
export const createAgentSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Agent name is required' })
      .min(1, 'Agent name cannot be empty')
      .max(255, 'Agent name too long')
      .trim(),
    description: z
      .string()
      .trim()
      .optional(),
    persona: z
      .string({ required_error: 'Agent persona is required' })
      .min(1, 'Agent persona cannot be empty')
      .trim(),
    skills: z
      .array(z.string())
      .default([]),
    permissions: z
      .array(z.string())
      .default([]),
    models: z
      .array(z.string())
      .default([]),
    vms: z
      .array(z.string())
      .default([]),
    openrouterApiKey: z
      .string()
      .trim()
      .optional(),
    vmConfig: z
      .object({
        host: z.string().optional(),
        port: z.number().optional(),
        username: z.string().optional(),
        sshKey: z.string().optional(),
        password: z.string().optional(),
      })
      .optional()
      .default({}),
    status: z
      .enum(['active', 'inactive', 'offline'])
      .default('active'),
  }),
});

export const updateAgentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid agent ID'),
  }),
  body: z.object({
    name: z.string().min(1).max(255).trim().optional(),
    description: z.string().trim().optional(),
    persona: z.string().min(1).trim().optional(),
    skills: z.array(z.string()).optional(),
    permissions: z.array(z.string()).optional(),
    models: z.array(z.string()).optional(),
    vms: z.array(z.string()).optional(),
    openrouterApiKey: z.string().trim().optional(),
    vmConfig: z.object({
      host: z.string().optional(),
      port: z.number().optional(),
      username: z.string().optional(),
      sshKey: z.string().optional(),
      password: z.string().optional(),
    }).optional(),
    status: z.enum(['active', 'inactive', 'offline']).optional(),
  }),
});

export const getAgentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid agent ID'),
  }),
});

// Conversation schemas
export const createConversationSchema = z.object({
  body: z.object({
    agentId: z
      .string({ required_error: 'Agent ID is required' })
      .uuid('Invalid agent ID'),
    title: z.string().max(200).trim().optional(),
  }),
});

export const getConversationSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid conversation ID'),
  }),
});

export const sendMessageSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid conversation ID'),
  }),
  body: z.object({
    content: z
      .string({ required_error: 'Message content is required' })
      .min(1, 'Message cannot be empty')
      .max(10000, 'Message too long'),
    role: z.enum(['user', 'agent']).default('user'),
  }),
});

export const updateConversationSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid conversation ID'),
  }),
  body: z.object({
    title: z.string().max(200).trim().optional(),
    status: z.enum(['active', 'archived']).optional(),
  }),
});

export const getMessagesSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid conversation ID'),
  }),
  query: z.object({
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 50))
      .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
    offset: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 0))
      .refine((val) => val >= 0, 'Offset must be 0 or greater'),
  }),
});

// Task schemas
export const createTaskSchema = z.object({
  body: z.object({
    agentId: z
      .string({ required_error: 'Agent ID is required' })
      .uuid('Invalid agent ID'),
    conversationId: z
      .string({ required_error: 'Conversation ID is required' })
      .uuid('Invalid conversation ID'),
    type: z
      .enum(['code', 'research', 'analysis', 'chat'])
      .default('chat'),
    input: z.record(z.any()).default({}),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
  }),
});

// Pagination schema
export const paginationSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .refine((val) => val > 0, 'Page must be greater than 0'),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 20))
      .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  }),
});

// Export types inferred from schemas
export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type CreateAgentInput = z.infer<typeof createAgentSchema>['body'];
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>['body'];
export type CreateConversationInput = z.infer<typeof createConversationSchema>['body'];
export type SendMessageInput = z.infer<typeof sendMessageSchema>['body'];
export type CreateTaskInput = z.infer<typeof createTaskSchema>['body'];
export type PaginationQuery = z.infer<typeof paginationSchema>['query'];
