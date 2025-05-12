import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate, refreshAccessToken } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { registerSchema, loginSchema, updateProfileSchema } from '../dto/auth.dto.js';
import {
    registerNumberSchema,
    requestOtpSchema,
    verifyOtpSchema
  } from '../dto/whatsapp.dto.js';

const router = Router();

// general auth
router.post('/register', validateRequest(registerSchema), AuthController.register);
router.post('/login', validateRequest(loginSchema), AuthController.login);
router.post('/refresh-token', refreshAccessToken);
router.post('/logout', AuthController.logout);

// Protected routes
router.get('/profile', authenticate, AuthController.getProfile);
router.put('/profile', authenticate, validateRequest(updateProfileSchema), AuthController.updateProfile);

// whatsaap auth
router.post('/register/phone_number', authenticate, validateRequest(registerNumberSchema), AuthController.registerNumber);
router.post('/request-verification/phone_number', authenticate, validateRequest(requestOtpSchema), AuthController.requestVerificationCode);
router.post('/verify/phone_number', authenticate, validateRequest(verifyOtpSchema), AuthController.verifyCode);

export default router; 