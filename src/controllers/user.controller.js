import { UserService } from '../services/user.service.js';

/**
 * Controller untuk user
 */
export class UserController {
  /**
   * Mendapatkan detail akun WhatsApp sendiri
   */
  static async getWhatsAppAccount(req, res, next) {
    try {
      const { id } = req.user;
      
      const waAccount = await UserService.getWhatsAppAccount(id);
      
      return res.status(200).json({
        status: 'success',
        data: waAccount
      });
    } catch (error) {
      next(error);
    }
  }
} 