import { Router } from 'express';
import packageController from '../controllers/package.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Public route untuk callback Midtrans
router.post('/callback', packageController.handlePaymentCallback);
router.get('/finish', packageController.handlePaymentFinish);

// Protected routes (harus login)
router.get('/types', authenticate, packageController.getAllPackages);
router.get('/active', authenticate, packageController.getActivePackage);
router.post('/purchase', authenticate, packageController.purchasePackage);
router.get('/transactions', authenticate, packageController.getTransactionHistory);

export default router; 