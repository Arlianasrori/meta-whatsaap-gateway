import { Router } from 'express';
import { TemplateController } from '../controllers/template.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { createOrUpdateTemplateSchema, createBlastSchema, updateBlastSchema } from '../dto/template.dto.js';

const router = Router();

// Middleware untuk autentikasi - semua endpoint memerlukan autentikasi
router.use(authenticate);

// Routes untuk template
router.post('/templates', validateRequest(createOrUpdateTemplateSchema), TemplateController.createTemplate);
router.get('/templates', TemplateController.getTemplates);
router.get('/templates/:templateId', TemplateController.getTemplateById);
router.get('/templates-meta', TemplateController.getTemplatesFromMeta);
router.put('/templates/:templateId', validateRequest(createOrUpdateTemplateSchema), TemplateController.updateTemplate);
router.delete('/templates/:templateId', TemplateController.deleteTemplate);
router.post('/templates/:templateId/submit', TemplateController.submitTemplate);
router.post('/templates/:templateId/sync', TemplateController.syncTemplateStatus);

// Routes untuk blast
router.post('/blast', validateRequest(createBlastSchema), TemplateController.createBlast);
router.get('/blast', TemplateController.getBlasts);
router.get('/blast/:blastId', TemplateController.getBlastById);
router.put('/blast/:blastId', validateRequest(updateBlastSchema), TemplateController.updateBlast);
router.delete('/blast/:blastId', TemplateController.deleteBlast);
router.post('/blast/:blastId/send', TemplateController.sendBlast);
router.post('/blast/:blastId/cancel', TemplateController.cancelBlast);

export default router; 