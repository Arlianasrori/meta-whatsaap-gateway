import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { authenticate, authorizeAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// user management
router.get('/users', authenticate, authorizeAdmin, AdminController.getAllUsers);
router.get('/users/:userId', authenticate, authorizeAdmin, AdminController.getUserById);
router.delete('/users/:userId', authenticate, authorizeAdmin, AdminController.deleteUser);

// statistik
router.get('/stats', authenticate, authorizeAdmin, AdminController.getSystemStats);
router.get('/logs/:userId', authenticate, authorizeAdmin, AdminController.getAllLogMessage);

// chatbot flow
router.get('/flows/user/:userId', authenticate, authorizeAdmin, AdminController.getAllFlowUser);
router.get('/flows/:flowId', authenticate, authorizeAdmin, AdminController.getFlowById);

export default router; 