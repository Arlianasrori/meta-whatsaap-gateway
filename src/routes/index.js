import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import whatsappRoutes from './whatsapp.routes.js';
import chatbotRoutes from './chatbot.routes.js';
import adminRoutes from './admin.routes.js';
import templateRoutes from './template.routes.js';
import packageRoutes from './package.routes.js';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/chatbot', chatbotRoutes);
router.use('/admin', adminRoutes);
router.use('/messaging', templateRoutes);
router.use('/packages', packageRoutes);

// API base route untuk health check
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'WhatsApp Gateway API',
    version: '1.0.0'
  });
});

export default router;