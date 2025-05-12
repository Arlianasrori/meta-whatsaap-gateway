import { Router } from 'express';
import { ChatbotController } from '../controllers/chatbot.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { UpdateOrCreateFlowSchema } from '../dto/chatbot.dto.js';

const router = Router();

// flow management
router.post('/flows', authenticate, validateRequest(UpdateOrCreateFlowSchema), ChatbotController.createFlow);
router.get('/flows', authenticate, ChatbotController.getFlows);
router.get('/flows/:flowId', authenticate, ChatbotController.getFlowById);
router.put('/flows/:flowId', authenticate, validateRequest(UpdateOrCreateFlowSchema), ChatbotController.updateFlow);
router.delete('/flows/:flowId', authenticate, ChatbotController.deleteFlow);
router.put('/flows/:flowId/activate', authenticate, ChatbotController.activateFlow);

export default router; 