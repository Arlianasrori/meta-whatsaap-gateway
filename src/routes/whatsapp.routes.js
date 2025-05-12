import { Router } from 'express';
import { WhatsAppController } from '../controllers/whatsapp.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import {
  sendTextMessageSchema
} from '../dto/whatsapp.dto.js';

const router = Router();

// Webhook (public)
router.get('/webhook', WhatsAppController.handleWebhook);
router.post('/webhook', WhatsAppController.handleWebhook);

// WABA Info endpoint
router.get('/waba-info', WhatsAppController.getWabaInfo);

// Protected routes dengan validasi DTO
router.post('/send-message', authenticate, validateRequest(sendTextMessageSchema), WhatsAppController.sendTextMessage);

export default router; 