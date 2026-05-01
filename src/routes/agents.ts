
import { Router } from 'express';
import { AgentController } from '../controllers/AgentController';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createAgentSchema,
  updateAgentSchema,
  getAgentSchema,
} from '../validation/schemas';

const router = Router();
const agentController = new AgentController();

// All agent routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/v1/agents
 * @desc    Create a new agent
 * @access  Private
 */
router.post('/', validate(createAgentSchema), agentController.create);

/**
 * @route   GET /api/v1/agents
 * @desc    Get all user's agents
 * @access  Private
 */
router.get('/', agentController.list);

/**
 * @route   GET /api/v1/agents/:id
 * @desc    Get agent by ID
 * @access  Private
 */
router.get('/:id', validate(getAgentSchema), agentController.get);

/**
 * @route   PATCH /api/v1/agents/:id
 * @desc    Update agent
 * @access  Private
 */
router.patch('/:id', validate(updateAgentSchema), agentController.update);

/**
 * @route   DELETE /api/v1/agents/:id
 * @desc    Delete agent
 * @access  Private
 */
router.delete('/:id', validate(getAgentSchema), agentController.delete);

export default router;
