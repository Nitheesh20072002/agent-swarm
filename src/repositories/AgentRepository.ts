
import { query, transaction } from '../database/client';
import { NotFoundError } from '../utils/errors';

export interface VmConfig {
  host?: string;
  port?: number;
  username?: string;
  sshKey?: string;
  password?: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  persona: string;
  userId: string;
  skills: string[];
  permissions: string[];
  models: string[];
  vms: string[];
  openrouterApiKey?: string;
  vmConfig: VmConfig;
  status: 'active' | 'inactive' | 'offline';
  isActive: boolean;
  state: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAgentData {
  name: string;
  description?: string;
  persona: string;
  userId: string;
  skills?: string[];
  permissions?: string[];
  models?: string[];
  vms?: string[];
  openrouterApiKey?: string | null;
  vmConfig?: VmConfig;
  status?: 'active' | 'inactive' | 'offline';
  isActive?: boolean;
  state?: string;
  metadata?: Record<string, any>;
}

export interface UpdateAgentData {
  name?: string;
  description?: string;
  persona?: string;
  skills?: string[];
  permissions?: string[];
  models?: string[];
  vms?: string[];
  openrouterApiKey?: string | null;
  vmConfig?: VmConfig;
  status?: 'active' | 'inactive' | 'offline';
  isActive?: boolean;
  state?: string;
  metadata?: Record<string, any>;
}

export class AgentRepository {
  /**
   * Create a new agent
   */
  async create(data: CreateAgentData): Promise<Agent> {
    const sql = `
      INSERT INTO agents (
        name, 
        description,
        persona, 
        user_id, 
        skills,
        permissions,
        models,
        vms,
        openrouter_api_key,
        vm_config,
        status,
        is_active,
        state,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING 
        id,
        name,
        description,
        persona,
        user_id as "userId",
        skills,
        permissions,
        models,
        vms,
        openrouter_api_key as "openrouterApiKey",
        vm_config as "vmConfig",
        status,
        is_active as "isActive",
        state,
        metadata,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await query<Agent>(sql, [
      data.name,
      data.description || '',
      data.persona,
      data.userId,
      data.skills || [],
      data.permissions || [],
      data.models || [],
      data.vms || [],
      data.openrouterApiKey || null,
      JSON.stringify(data.vmConfig || {}),
      data.status || 'active',
      data.isActive !== undefined ? data.isActive : true,
      data.state || 'idle',
      JSON.stringify(data.metadata || {}),
    ]);

    const agent = result.rows[0];
    // Parse JSON fields
    if (typeof agent.vmConfig === 'string') {
      agent.vmConfig = JSON.parse(agent.vmConfig);
    }
    if (typeof agent.metadata === 'string') {
      agent.metadata = JSON.parse(agent.metadata);
    }

    return agent;
  }

  /**
   * Find agent by ID
   */
  async findById(id: string): Promise<Agent | null> {
    const sql = `
      SELECT 
        id,
        name,
        description,
        persona,
        user_id as "userId",
        skills,
        permissions,
        models,
        vms,
        openrouter_api_key as "openrouterApiKey",
        vm_config as "vmConfig",
        status,
        is_active as "isActive",
        state,
        metadata,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM agents
      WHERE id = $1
    `;

    const result = await query<Agent>(sql, [id]);
    if (result.rows.length === 0) {
      return null;
    }

    const agent = result.rows[0];
    // Parse JSON fields
    if (typeof agent.vmConfig === 'string') {
      agent.vmConfig = JSON.parse(agent.vmConfig);
    }
    if (typeof agent.metadata === 'string') {
      agent.metadata = JSON.parse(agent.metadata);
    }

    return agent;
  }

  /**
   * Find agent by ID or throw
   */
  async findByIdOrThrow(id: string): Promise<Agent> {
    const agent = await this.findById(id);
    if (!agent) {
      throw new NotFoundError(`Agent with id ${id} not found`);
    }
    return agent;
  }

  /**
   * Find all agents for a user
   */
  async findByUserId(userId: string): Promise<Agent[]> {
    const sql = `
      SELECT 
        id,
        name,
        description,
        persona,
        user_id as "userId",
        skills,
        permissions,
        models,
        vms,
        openrouter_api_key as "openrouterApiKey",
        vm_config as "vmConfig",
        status,
        is_active as "isActive",
        state,
        metadata,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM agents
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;

    const result = await query<Agent>(sql, [userId]);
    
    // Parse JSON fields for each agent
    return result.rows.map(agent => {
      if (typeof agent.vmConfig === 'string') {
        agent.vmConfig = JSON.parse(agent.vmConfig);
      }
      if (typeof agent.metadata === 'string') {
        agent.metadata = JSON.parse(agent.metadata);
      }
      return agent;
    });
  }

  /**
   * Find active agents for a user
   */
  async findActiveByUserId(userId: string): Promise<Agent[]> {
    const sql = `
      SELECT 
        id,
        name,
        description,
        persona,
        user_id as "userId",
        skills,
        permissions,
        models,
        vms,
        openrouter_api_key as "openrouterApiKey",
        vm_config as "vmConfig",
        status,
        is_active as "isActive",
        state,
        metadata,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM agents
      WHERE user_id = $1 AND is_active = true
      ORDER BY created_at DESC
    `;

    const result = await query<Agent>(sql, [userId]);
    
    // Parse JSON fields for each agent
    return result.rows.map(agent => {
      if (typeof agent.vmConfig === 'string') {
        agent.vmConfig = JSON.parse(agent.vmConfig);
      }
      if (typeof agent.metadata === 'string') {
        agent.metadata = JSON.parse(agent.metadata);
      }
      return agent;
    });
  }

  /**
   * Find agents by state
   */
  async findByState(state: string): Promise<Agent[]> {
    const sql = `
      SELECT 
        id,
        name,
        description,
        persona,
        user_id as "userId",
        skills,
        permissions,
        models,
        vms,
        openrouter_api_key as "openrouterApiKey",
        vm_config as "vmConfig",
        status,
        is_active as "isActive",
        state,
        metadata,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM agents
      WHERE state = $1
      ORDER BY updated_at DESC
    `;

    const result = await query<Agent>(sql, [state]);
    
    // Parse JSON fields for each agent
    return result.rows.map(agent => {
      if (typeof agent.vmConfig === 'string') {
        agent.vmConfig = JSON.parse(agent.vmConfig);
      }
      if (typeof agent.metadata === 'string') {
        agent.metadata = JSON.parse(agent.metadata);
      }
      return agent;
    });
  }

  /**
   * Update agent
   */
  async update(id: string, data: UpdateAgentData): Promise<Agent> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }

    if (data.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(data.description);
    }

    if (data.persona !== undefined) {
      updates.push(`persona = $${paramCount++}`);
      values.push(data.persona);
    }

    if (data.skills !== undefined) {
      updates.push(`skills = $${paramCount++}`);
      values.push(data.skills);
    }

    if (data.permissions !== undefined) {
      updates.push(`permissions = $${paramCount++}`);
      values.push(data.permissions);
    }

    if (data.models !== undefined) {
      updates.push(`models = $${paramCount++}`);
      values.push(data.models);
    }

    if (data.vms !== undefined) {
      updates.push(`vms = $${paramCount++}`);
      values.push(data.vms);
    }

    if (data.openrouterApiKey !== undefined) {
      updates.push(`openrouter_api_key = $${paramCount++}`);
      values.push(data.openrouterApiKey);
    }

    if (data.vmConfig !== undefined) {
      updates.push(`vm_config = $${paramCount++}`);
      values.push(JSON.stringify(data.vmConfig));
    }

    if (data.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(data.status);
    }

    if (data.isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(data.isActive);
    }

    if (data.state !== undefined) {
      updates.push(`state = $${paramCount++}`);
      values.push(data.state);
    }

    if (data.metadata !== undefined) {
      updates.push(`metadata = $${paramCount++}`);
      values.push(JSON.stringify(data.metadata));
    }

    if (updates.length === 0) {
      return this.findByIdOrThrow(id);
    }

    values.push(id);

    const sql = `
      UPDATE agents
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING 
        id,
        name,
        description,
        persona,
        user_id as "userId",
        skills,
        permissions,
        models,
        vms,
        openrouter_api_key as "openrouterApiKey",
        vm_config as "vmConfig",
        status,
        is_active as "isActive",
        state,
        metadata,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await query<Agent>(sql, values);

    if (result.rows.length === 0) {
      throw new NotFoundError(`Agent with id ${id} not found`);
    }

    const agent = result.rows[0];
    // Parse JSON fields
    if (typeof agent.vmConfig === 'string') {
      agent.vmConfig = JSON.parse(agent.vmConfig);
    }
    if (typeof agent.metadata === 'string') {
      agent.metadata = JSON.parse(agent.metadata);
    }

    return agent;
  }

  /**
   * Update agent state
   */
  async updateState(id: string, state: string): Promise<void> {
    const sql = `UPDATE agents SET state = $1 WHERE id = $2`;
    const result = await query(sql, [state, id]);

    if (result.rowCount === 0) {
      throw new NotFoundError(`Agent with id ${id} not found`);
    }
  }

  /**
   * Delete agent
   */
  async delete(id: string): Promise<void> {
    const sql = `DELETE FROM agents WHERE id = $1`;
    const result = await query(sql, [id]);

    if (result.rowCount === 0) {
      throw new NotFoundError(`Agent with id ${id} not found`);
    }
  }

  /**
   * Count agents by user
   */
  async countByUserId(userId: string): Promise<number> {
    const sql = `SELECT COUNT(*)::int as count FROM agents WHERE user_id = $1`;
    const result = await query<{ count: number }>(sql, [userId]);
    return result.rows[0].count;
  }

  /**
   * Get agent with conversation count
   */
  async findByIdWithStats(id: string): Promise<Agent & { conversationCount: number } | null> {
    const sql = `
      SELECT 
        a.id,
        a.name,
        a.description,
        a.persona,
        a.user_id as "userId",
        a.skills,
        a.permissions,
        a.models,
        a.vms,
        a.openrouter_api_key as "openrouterApiKey",
        a.vm_config as "vmConfig",
        a.status,
        a.is_active as "isActive",
        a.state,
        a.metadata,
        a.created_at as "createdAt",
        a.updated_at as "updatedAt",
        COUNT(c.id)::int as "conversationCount"
      FROM agents a
      LEFT JOIN conversations c ON a.id = c.agent_id
      WHERE a.id = $1
      GROUP BY a.id
    `;

    const result = await query<Agent & { conversationCount: number }>(sql, [id]);
    if (result.rows.length === 0) {
      return null;
    }

    const agent = result.rows[0];
    // Parse JSON fields
    if (typeof agent.vmConfig === 'string') {
      agent.vmConfig = JSON.parse(agent.vmConfig);
    }
    if (typeof agent.metadata === 'string') {
      agent.metadata = JSON.parse(agent.metadata);
    }

    return agent;
  }
}

// Export singleton instance
export const agentRepository = new AgentRepository();
