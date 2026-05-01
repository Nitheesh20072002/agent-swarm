
import { Request, Response, NextFunction } from 'express';
import { AgentService } from '../services/AgentService';
import { getCurrentUser } from '../middleware/auth';

/**
 * Agent Controller
 * Handles HTTP requests for agent management
 */
export class AgentController {
  private agentService: AgentService;

  constructor() {
    this.agentService = new AgentService();
  }

  /**
   * Create a new agent
   * POST /api/v1/agents
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = getCurrentUser(req);
      const {
        name,
        description,
        persona,
        skills,
        permissions,
        models,
        vms,
        openrouterApiKey,
        vmConfig,
        status
      } = req.body;

      const agent = await this.agentService.createAgent({
        userId: user.id,
        name,
        description,
        persona,
        skills,
        permissions,
        models,
        vms,
        openrouterApiKey,
        vmConfig,
        status,
      });

      res.status(201).json({
        status: 'success',
        message: 'Agent created successfully',
        data: { agent },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all user's agents
   * GET /api/v1/agents
   */
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = getCurrentUser(req);

      const agents = await this.agentService.getUserAgents(user.id);

      res.status(200).json({
        status: 'success',
        data: {
          agents,
          count: agents.length,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get agent by ID
   * GET /api/v1/agents/:id
   */
  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = getCurrentUser(req);
      const { id } = req.params;

      const agent = await this.agentService.getAgentById(id, user.id);

      res.status(200).json({
        status: 'success',
        data: { agent },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update agent
   * PATCH /api/v1/agents/:id
   */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = getCurrentUser(req);
      const { id } = req.params;
      const updates = req.body;

      const agent = await this.agentService.updateAgent(id, user.id, updates);

      res.status(200).json({
        status: 'success',
        message: 'Agent updated successfully',
        data: { agent },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete agent
   * DELETE /api/v1/agents/:id
   */
  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = getCurrentUser(req);
      const { id } = req.params;

      await this.agentService.deleteAgent(id, user.id);

      res.status(200).json({
        status: 'success',
        message: 'Agent deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
