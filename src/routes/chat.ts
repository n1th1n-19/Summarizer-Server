import express from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import chatController from '../controllers/chatController';
import { validateRequest, sanitizeInput } from '../middleware/zodValidation';
import { aiOperationsLimiter } from '../middleware/rateLimiting';
import {
  createChatSessionSchema,
  chatSessionParamsSchema,
  sendMessageSchema,
  quickQuerySchema,
  chatSessionsQuerySchema
} from '../schemas';

const router = express.Router();

router.use(authenticateToken);

// @route   POST /chat/sessions
// @desc    Create new chat session
// @access  Private
router.post('/sessions',
  sanitizeInput,
  validateRequest(createChatSessionSchema),
  chatController.createSession
);

// @route   GET /chat/sessions
// @desc    Get user's chat sessions
// @access  Private
router.get('/sessions', validateRequest(chatSessionsQuerySchema), chatController.getSessions);

// @route   GET /chat/sessions/:id
// @desc    Get specific chat session with messages
// @access  Private
router.get('/sessions/:id', 
  validateRequest(chatSessionParamsSchema),
  chatController.getSession
);

// @route   DELETE /chat/sessions/:id
// @desc    Delete chat session
// @access  Private
router.delete('/sessions/:id',
  validateRequest(chatSessionParamsSchema),
  chatController.deleteSession
);

// @route   POST /chat/sessions/:id/messages
// @desc    Send message in chat session
// @access  Private
// Create combined schema for params + body validation
const sendMessageCombinedSchema = z.object({
  params: chatSessionParamsSchema.shape.params,
  body: sendMessageSchema.shape.body
});

router.post('/sessions/:id/messages',
  aiOperationsLimiter,
  sanitizeInput,
  validateRequest(sendMessageCombinedSchema),
  chatController.sendMessage
);

// @route   POST /chat/query
// @desc    Quick query without creating session
// @access  Private
router.post('/query',
  aiOperationsLimiter,
  sanitizeInput,
  validateRequest(quickQuerySchema),
  chatController.quickQuery
);

export default router;