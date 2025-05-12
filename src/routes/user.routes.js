import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Semua routes user memerlukan autentikasi
router.get('/whatsapp-account', authenticate, UserController.getWhatsAppAccount);

export default router; 