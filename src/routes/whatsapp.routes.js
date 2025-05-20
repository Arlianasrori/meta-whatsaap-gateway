import { Router } from 'express';
import { WhatsAppController } from '../controllers/whatsapp.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import {
  sendTextMessageSchema,
  sendButtonMessageSchema,
  sendListMessageSchema,
  sendImageMessageSchema,
  sendDocumentMessageSchema,
  sendLocationMessageSchema
} from '../dto/whatsapp.dto.js';

const router = Router();

// Webhook (public)
router.get('/webhook', WhatsAppController.handleWebhook);
router.post('/webhook', WhatsAppController.handleWebhook);

// WABA Info endpoint
router.get('/waba-info', WhatsAppController.getWabaInfo);

// Protected routes dengan validasi DTO
router.post('/send-message', authenticate, validateRequest(sendTextMessageSchema), WhatsAppController.sendTextMessage);
router.post('/send-button', authenticate, validateRequest(sendButtonMessageSchema), WhatsAppController.sendButtonMessage);
router.post('/send-list', authenticate, validateRequest(sendListMessageSchema), WhatsAppController.sendListMessage);
router.post('/send-image', authenticate, validateRequest(sendImageMessageSchema), WhatsAppController.sendImageMessage);
router.post('/send-document', authenticate, validateRequest(sendDocumentMessageSchema), WhatsAppController.sendDocumentMessage);
router.post('/send-location', authenticate, validateRequest(sendLocationMessageSchema), WhatsAppController.sendLocationMessage);

export default router; 