import { Router } from 'express';
import packageController from '../controllers/package.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Public route untuk callback Midtrans
router.post('/callback', packageController.handlePaymentCallback);
router.get('/finish', packageController.handlePaymentFinish);

// Protected routes (harus login)
router.get('/types', authenticateToken, packageController.getAllPackages);
router.get('/active', authenticateToken, packageController.getActivePackage);
router.post('/purchase', authenticateToken, packageController.purchasePackage);
router.get('/transactions', authenticateToken, packageController.getTransactionHistory);

export default router; 