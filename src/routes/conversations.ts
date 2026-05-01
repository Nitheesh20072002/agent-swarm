
import { Router } from 'express';
import { ConversationController } from '../controllers/ConversationController';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createConversationSchema,
  getConversationSchema,
  updateConversationSchema,
  sendMessageSchema,
  getMessagesSchema,
} from '../validation/schemas';

const router = Router();
const conversationController = new ConversationController();

// All conversation routes require authentication
router.use(authMiddleware);

/**
 * POST /api/conversations
 * Create a new conversation
 */
router.post(
  '/',
  validate(createConversationSchema),
  conversationController.create
);

/**
 * GET /api/conversations
 * Get all conversations for the authenticated user
 */
router.get('/', conversationController.list);

/**
 * GET /api/conversations/:id
 * Get a specific conversation with messages
 */
router.get(
  '/:id',
  validate(getConversationSchema),
  conversationController.getById
);

/**
 * PATCH /api/conversations/:id
 * Update a conversation (title, status)
 */
router.patch(
  '/:id',
  validate(updateConversationSchema),
  conversationController.update
);

/**
 * DELETE /api/conversations/:id
 * Delete a conversation
 */
router.delete(
  '/:id',
  validate(getConversationSchema),
  conversationController.delete
);

/**
 * POST /api/conversations/:id/archive
 * Archive a conversation
 */
router.post(
  '/:id/archive',
  validate(getConversationSchema),
  conversationController.archive
);

/**
 * POST /api/conversations/:id/messages
 * Send a message in a conversation
 */
router.post(
  '/:id/messages',
  validate(sendMessageSchema),
  conversationController.sendMessage
);

/**
 * GET /api/conversations/:id/messages
 * Get messages for a conversation with pagination
 */
router.get(
  '/:id/messages',
  validate(getMessagesSchema),
  conversationController.getMessages
);

export default router;
