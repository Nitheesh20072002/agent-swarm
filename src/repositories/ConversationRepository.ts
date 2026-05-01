
import { pool } from '../database/client';
import { logger } from '../utils/logger';

export interface CreateConversationInput {
  userId: string;
  agentId: string;
  title: string;
  status: 'active' | 'archived';
}

export interface UpdateConversationInput {
  title?: string;
  status?: 'active' | 'archived';
  updatedAt?: Date;
}

export interface CreateMessageInput {
  conversationId: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  metadata?: any;
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

/**
 * Conversation Repository
 * Handles database operations for conversations and messages
 */
export class ConversationRepository {
  /**
   * Create a new conversation
   */
  async create(input: CreateConversationInput): Promise<Conversation> {
    const { userId, agentId, title, status } = input;

    const query = `
      INSERT INTO conversations (user_id, agent_id, title, status)
      VALUES ($1, $2, $3, $4)
      RETURNING 
        id,
        user_id as "userId",
        agent_id as "agentId",
        title,
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    try {
      const result = await pool.query(query, [userId, agentId, title, status]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating conversation', { error, userId, agentId });
      throw error;
    }
  }

  /**
   * Find conversation by ID
   */
  async findById(id: string): Promise<Conversation | null> {
    const query = `
      SELECT 
        id,
        user_id as "userId",
        agent_id as "agentId",
        title,
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM conversations
      WHERE id = $1
    `;

    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding conversation by ID', { error, id });
      throw error;
    }
  }

  /**
   * Find all conversations for a user
   */
  async findByUserId(userId: string): Promise<Conversation[]> {
    const query = `
      SELECT 
        id,
        user_id as "userId",
        agent_id as "agentId",
        title,
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM conversations
      WHERE user_id = $1
      ORDER BY updated_at DESC
    `;

    try {
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding conversations by user ID', { error, userId });
      throw error;
    }
  }

  /**
   * Find conversations by agent ID
   */
  async findByAgentId(agentId: string): Promise<Conversation[]> {
    const query = `
      SELECT 
        id,
        user_id as "userId",
        agent_id as "agentId",
        title,
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM conversations
      WHERE agent_id = $1
      ORDER BY updated_at DESC
    `;

    try {
      const result = await pool.query(query, [agentId]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding conversations by agent ID', { error, agentId });
      throw error;
    }
  }

  /**
   * Update a conversation
   */
  async update(id: string, input: UpdateConversationInput): Promise<Conversation | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (input.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      values.push(input.title);
    }

    if (input.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(input.status);
    }

    if (input.updatedAt !== undefined) {
      fields.push(`updated_at = $${paramCount++}`);
      values.push(input.updatedAt);
    } else {
      fields.push(`updated_at = NOW()`);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const query = `
      UPDATE conversations
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING 
        id,
        user_id as "userId",
        agent_id as "agentId",
        title,
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    try {
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating conversation', { error, id, input });
      throw error;
    }
  }

  /**
   * Delete a conversation
   */
  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM conversations WHERE id = $1';

    try {
      const result = await pool.query(query, [id]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      logger.error('Error deleting conversation', { error, id });
      throw error;
    }
  }

  /**
   * Create a message in a conversation
   */
  async createMessage(input: CreateMessageInput): Promise<Message> {
    const { conversationId, role, content, metadata = {} } = input;

    const query = `
      INSERT INTO messages (conversation_id, role, content, metadata)
      VALUES ($1, $2, $3, $4)
      RETURNING 
        id,
        conversation_id as "conversationId",
        role,
        content,
        metadata,
        created_at as "createdAt"
    `;

    try {
      const result = await pool.query(query, [
        conversationId,
        role,
        content,
        JSON.stringify(metadata),
      ]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating message', { error, conversationId, role });
      throw error;
    }
  }

  /**
   * Find messages by conversation ID with pagination
   */
  async findMessagesByConversationId(
    conversationId: string,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Message[]> {
    const { limit = 50, offset = 0 } = options;

    const query = `
      SELECT
        id,
        conversation_id as "conversationId",
        role,
        content,
        metadata,
        created_at as "createdAt"
      FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    try {
      const result = await pool.query(query, [conversationId, limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding messages by conversation ID', {
        error,
        conversationId,
      });
      throw error;
    }
  }

  /**
   * Get message count for a conversation
   */
  async getMessageCount(conversationId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM messages
      WHERE conversation_id = $1
    `;

    try {
      const result = await pool.query(query, [conversationId]);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Error getting message count', { error, conversationId });
      throw error;
    }
  }

  /**
   * Delete messages by conversation ID
   */
  async deleteMessagesByConversationId(conversationId: string): Promise<boolean> {
    const query = 'DELETE FROM messages WHERE conversation_id = $1';

    try {
      const result = await pool.query(query, [conversationId]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      logger.error('Error deleting messages by conversation ID', {
        error,
        conversationId,
      });
      throw error;
    }
  }
}
