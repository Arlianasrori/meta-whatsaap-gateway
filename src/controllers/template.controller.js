import { TemplateService } from '../services/template.service.js';
import { BlastService } from '../services/blast.service.js';

/**
 * Controller untuk manajemen template dan blast WhatsApp
 */
export class TemplateController {
  /**
   * Membuat template baru
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   */
  static async createTemplate(req, res, next) {
    try {
      const userId = req.user.id;
      const templateData = req.body;
      
      const template = await TemplateService.createTemplate(userId, templateData);
      
      res.status(201).json({
        status: 'success',
        message: 'Template berhasil dibuat',
        data: { template }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mengajukan template ke WhatsApp
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   */
  static async submitTemplate(req, res, next) {
    try {
      const { templateId } = req.params;
      
      // Cek apakah template milik user ini
      const template = await TemplateService.getTemplateById(templateId);
      
      if (!template) {
        return res.status(404).json({
          status: 'error',
          message: 'Template tidak ditemukan'
        });
      }
      
      if (template.userId !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'Tidak berwenang untuk mengakses template ini'
        });
      }
      
      const submittedTemplate = await TemplateService.submitTemplateToMeta(templateId);
      
      res.status(200).json({
        status: 'success',
        message: 'Template berhasil diajukan ke WhatsApp',
        data: { template: submittedTemplate }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mendapatkan semua template milik user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   */
  static async getTemplates(req, res, next) {
    try {
      const userId = req.user.id;
      const { status } = req.query;
      
      const templates = await TemplateService.getTemplatesByUser(userId, status);
      
      res.status(200).json({
        status: 'success',
        data: { templates }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mendapatkan template berdasarkan ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   */
  static async getTemplateById(req, res, next) {
    try {
      const { templateId } = req.params;
      
      const template = await TemplateService.getTemplateById(templateId);
      
      if (!template) {
        return res.status(404).json({
          status: 'error',
          message: 'Template tidak ditemukan'
        });
      }
      
      if (template.userId !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'Tidak berwenang untuk mengakses template ini'
        });
      }
      
      res.status(200).json({
        status: 'success',
        data: { template }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mengupdate template
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   */
  static async updateTemplate(req, res, next) {
    try {
      const { templateId } = req.params;
      const updateData = req.body;
      
      // Cek apakah template milik user ini
      const template = await TemplateService.getTemplateById(templateId);
      
      if (!template) {
        return res.status(404).json({
          status: 'error',
          message: 'Template tidak ditemukan'
        });
      }
      
      if (template.userId !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'Tidak berwenang untuk mengakses template ini'
        });
      }
      
      const updatedTemplate = await TemplateService.updateTemplate(templateId, updateData);
      
      res.status(200).json({
        status: 'success',
        message: 'Template berhasil diupdate',
        data: { template: updatedTemplate }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Menghapus template
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   */
  static async deleteTemplate(req, res, next) {
    try {
      const { templateId } = req.params;
      
      // Cek apakah template milik user ini
      const template = await TemplateService.getTemplateById(templateId);
      
      if (!template) {
        return res.status(404).json({
          status: 'error',
          message: 'Template tidak ditemukan'
        });
      }
      
      if (template.userId !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'Tidak berwenang untuk mengakses template ini'
        });
      }
      
      await TemplateService.deleteTemplate(templateId);
      
      res.status(200).json({
        status: 'success',
        message: 'Template berhasil dihapus'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Menyinkronkan status template dari Meta
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   */
  static async syncTemplateStatus(req, res, next) {
    try {
      const { templateId } = req.params;
      
      // Cek apakah template milik user ini
      const template = await TemplateService.getTemplateById(templateId);
      
      if (!template) {
        return res.status(404).json({
          status: 'error',
          message: 'Template tidak ditemukan'
        });
      }
      
      if (template.userId !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'Tidak berwenang untuk mengakses template ini'
        });
      }
      
      const updatedTemplate = await TemplateService.syncTemplateStatus(templateId);
      
      res.status(200).json({
        status: 'success',
        message: 'Status template berhasil disinkronkan',
        data: { template: updatedTemplate }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Membuat blast baru
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   */
  static async createBlast(req, res, next) {
    try {
      const userId = req.user.id;
      const blastData = req.body;
      
      const blast = await BlastService.createBlast(userId, blastData);
      
      res.status(201).json({
        status: 'success',
        message: 'Blast berhasil dibuat',
        data: { blast }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mendapatkan semua blast milik user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   */
  static async getBlasts(req, res, next) {
    try {
      const userId = req.user.id;
      const { status } = req.query;
      
      const blasts = await BlastService.getBlastsByUser(userId, status);
      
      res.status(200).json({
        status: 'success',
        data: { blasts }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mendapatkan blast berdasarkan ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   */
  static async getBlastById(req, res, next) {
    try {
      const { blastId } = req.params;
      
      const blast = await BlastService.getBlastById(blastId);
      
      if (!blast) {
        return res.status(404).json({
          status: 'error',
          message: 'Blast tidak ditemukan'
        });
      }
      
      if (blast.userId !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'Tidak berwenang untuk mengakses blast ini'
        });
      }
      
      res.status(200).json({
        status: 'success',
        data: { blast }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mengupdate blast
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   */
  static async updateBlast(req, res, next) {
    try {
      const { blastId } = req.params;
      const updateData = req.body;
      
      // Cek apakah blast milik user ini
      const blast = await BlastService.getBlastById(blastId);
      
      if (!blast) {
        return res.status(404).json({
          status: 'error',
          message: 'Blast tidak ditemukan'
        });
      }
      
      if (blast.userId !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'Tidak berwenang untuk mengakses blast ini'
        });
      }
      
      const updatedBlast = await BlastService.updateBlast(blastId, updateData);
      
      res.status(200).json({
        status: 'success',
        message: 'Blast berhasil diupdate',
        data: { blast: updatedBlast }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Menghapus blast
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   */
  static async deleteBlast(req, res, next) {
    try {
      const { blastId } = req.params;
      
      // Cek apakah blast milik user ini
      const blast = await BlastService.getBlastById(blastId);
      
      if (!blast) {
        return res.status(404).json({
          status: 'error',
          message: 'Blast tidak ditemukan'
        });
      }
      
      if (blast.userId !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'Tidak berwenang untuk mengakses blast ini'
        });
      }
      
      await BlastService.deleteBlast(blastId);
      
      res.status(200).json({
        status: 'success',
        message: 'Blast berhasil dihapus'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mengirim blast
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   */
  static async sendBlast(req, res, next) {
    try {
      const { blastId } = req.params;
      
      // Cek apakah blast milik user ini
      const blast = await BlastService.getBlastById(blastId);
      
      if (!blast) {
        return res.status(404).json({
          status: 'error',
          message: 'Blast tidak ditemukan'
        });
      }
      
      if (blast.userId !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'Tidak berwenang untuk mengakses blast ini'
        });
      }
      
      const sentBlast = await BlastService.sendBlast(blastId);
      
      res.status(200).json({
        status: 'success',
        message: 'Blast berhasil dikirim',
        data: { blast: sentBlast }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Membatalkan blast
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   */
  static async cancelBlast(req, res, next) {
    try {
      const { blastId } = req.params;
      
      // Cek apakah blast milik user ini
      const blast = await BlastService.getBlastById(blastId);
      
      if (!blast) {
        return res.status(404).json({
          status: 'error',
          message: 'Blast tidak ditemukan'
        });
      }
      
      if (blast.userId !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'Tidak berwenang untuk mengakses blast ini'
        });
      }
      
      const cancelledBlast = await BlastService.cancelBlast(blastId);
      
      res.status(200).json({
        status: 'success',
        message: 'Blast berhasil dibatalkan',
        data: { blast: cancelledBlast }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mendapatkan semua template langsung dari Meta API
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   */
  static async getTemplatesFromMeta(req, res, next) {
    try {
      const userId = req.user.id;
      
      const templates = await TemplateService.getTemplatesFromMeta(userId);
      
      res.status(200).json({
        status: 'success',
        data: { templates }
      });
    } catch (error) {
      next(error);
    }
  }
} 