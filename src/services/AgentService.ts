
import { AgentRepository } from '../repositories/AgentRepository';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface VmConfig {
  host?: string;
  port?: number;
  username?: string;
  sshKey?: string;
  password?: string;
}

export interface CreateAgentInput {
  userId: string;
  name: string;
  description?: string;
  persona: string;
  skills?: string[];
  permissions?: string[];
  models?: string[];
  vms?: string[];
  openrouterApiKey?: string;
  vmConfig?: VmConfig;
  status?: 'active' | 'inactive' | 'offline';
}

export interface UpdateAgentInput {
  name?: string;
  description?: string;
  persona?: string;
  skills?: string[];
  permissions?: string[];
  models?: string[];
  vms?: string[];
  openrouterApiKey?: string;
  vmConfig?: VmConfig;
  status?: 'active' | 'inactive' | 'offline';
}

export interface Agent {
  id: string;
  userId: string;
  name: string;
  description?: string;
  persona: string;
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

/**
 * Agent Service
 * Handles business logic for AI agents
 */
export class AgentService {
  private agentRepository: AgentRepository;

  constructor() {
    this.agentRepository = new AgentRepository();
  }

  /**
   * Create a new agent
   */
  async createAgent(input: CreateAgentInput): Promise<Agent> {
    const {
      userId,
      name,
      description,
      persona,
      skills = [],
      permissions = [],
      models = [],
      vms = [],
      openrouterApiKey,
      vmConfig = {},
      status = 'active'
    } = input;

    // Set default OpenRouter models if no models specified
    const defaultModels = models.length > 0 ? models : [
      'meta-llama/llama-3.1-8b-instruct:free',
      'microsoft/phi-3-mini-128k-instruct:free',
      'google/gemma-2-9b-it:free'
    ];

    // Create agent in database
    const agent = await this.agentRepository.create({
      userId,
      name,
      description: description || '',
      persona,
      skills,
      permissions,
      models: defaultModels,
      vms,
      openrouterApiKey: openrouterApiKey || null,
      vmConfig,
      status,
      isActive: status === 'active',
      state: 'idle',
      metadata: {}
    });

    logger.info('Agent created', {
      agentId: agent.id,
      userId: agent.userId,
      name: agent.name,
      models: defaultModels,
    });

    return agent;
  }

  /**
   * Get agent by ID
   */
  async getAgentById(agentId: string, userId: string): Promise<Agent> {
    const agent = await this.agentRepository.findById(agentId);

    if (!agent) {
      throw new NotFoundError('Agent not found');
    }

    // Check if user owns this agent
    if (agent.userId !== userId) {
      throw new ForbiddenError('You do not have access to this agent');
    }

    return agent;
  }

  /**
   * Get all agents for a user
   */
  async getUserAgents(userId: string): Promise<Agent[]> {
    const agents = await this.agentRepository.findByUserId(userId);
    return agents;
  }

  /**
   * Update agent
   */
  async updateAgent(
    agentId: string,
    userId: string,
    updates: UpdateAgentInput
  ): Promise<Agent> {
    // Check if agent exists and user owns it
    const existingAgent = await this.getAgentById(agentId, userId);

    // Update agent
    const updatedAgent = await this.agentRepository.update(agentId, updates);

    if (!updatedAgent) {
      throw new NotFoundError('Agent not found after update');
    }

    logger.info('Agent updated', {
      agentId: updatedAgent.id,
      userId: updatedAgent.userId,
      updates,
    });

    return updatedAgent;
  }

  /**
   * Delete agent
   */
  async deleteAgent(agentId: string, userId: string): Promise<void> {
    // Check if agent exists and user owns it
    await this.getAgentById(agentId, userId);

    // Delete agent
    await this.agentRepository.delete(agentId);

    logger.info('Agent deleted', { agentId, userId });

    // TODO: Terminate VM for agent (Phase 2)
    // await this.terminateAgentVM(agentId);
  }

  /**
   * Update agent status
   */
  async updateAgentStatus(
    agentId: string,
    status: 'active' | 'inactive' | 'offline'
  ): Promise<Agent> {
    const agent = await this.agentRepository.update(agentId, { status });

    if (!agent) {
      throw new NotFoundError('Agent not found');
    }

    logger.debug('Agent status updated', { agentId, status });

    return agent;
  }

  /**
   * Check if agent is available for tasks
   */
  async isAgentAvailable(agentId: string): Promise<boolean> {
    const agent = await this.agentRepository.findById(agentId);
    
    if (!agent) {
      return false;
    }

    return agent.status === 'active' && agent.state === 'idle';
  }
}
