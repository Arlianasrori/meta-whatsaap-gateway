import { UserService } from '../services/user.service.js';
import { ChatbotService } from '../services/chatbot.service.js';
import prisma from '../config/database.js';

/**
 * Controller untuk fungsi admin
 */
export class AdminController {
  /**
   * Mendapatkan daftar semua user
   */
  static async getAllUsers(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      
      const result = await UserService.getAllUsers(
        parseInt(page), 
        parseInt(limit)
      );
      
      return res.status(200).json({
        status: 'success',
        data: result.users,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Mendapatkan detail user berdasarkan ID
   */
  static async getUserById(req, res, next) {
    try {
      const { userId } = req.params;
      
      const user = await UserService.getUserById(userId);
      
      return res.status(200).json({
        status: 'success',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Menghapus user
   */
  static async deleteUser(req, res, next) {
    try {
      const { userId } = req.params;
      
      // Proteksi jika user yang dihapus adalah diri sendiri
      if (userId === req.user.id) {
        return res.status(400).json({
          status: 'error',
          message: 'Anda tidak dapat menghapus akun Anda sendiri'
        });
      }
      
      const deletedUser = await UserService.deleteUser(userId);
      
      return res.status(200).json({
        status: 'success',
        message: 'User berhasil dihapus',
        data: deletedUser
      });
    } catch (error) {
      next(error);
    }
  }


  // statistik
  
  /**
   * Mendapatkan statistik sistem
   */
  static async getSystemStats(req, res, next) {
    try {
      // Hitung total user
      const totalUsers = await prisma.user.count({where : {role : "USER"}});
      
      // Hitung total nomor WA yang terverifikasi
      const totalVerifiedNumbers = await prisma.waAccountDetail.count({
        where: { verified: true }
      });
      
      // Hitung total flow chatbot
      const totalChatFlows = await prisma.chatFlow.count();
      
      // Hitung total percakapan dalam 7 hari terakhir
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      const totalChatsLastWeek = await prisma.chatLog.count({
        where: {
          createdAt: {
            gte: lastWeek
          }
        }
      });
      
      return res.status(200).json({
        status: 'success',
        data: {
          totalUsers,
          totalVerifiedNumbers,
          totalChatFlows,
          totalChatsLastWeek
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllLogMessage(req, res, next) {
    try {
      const userId = req.params.userId;
      const logs = await WhatsAppService.getAllLogMessage(userId);
      return res.status(200).json({
        status: 'success',
        data: logs
      });
    } catch (error) {
      next(error);
    }
  }


  // chatbot flow
  static async getAllFlowUser(req, res, next) {
    try {
      const { userId } = req.params;
      const flow = await ChatbotService.getFlowsByUser(userId);
      return res.status(200).json({
        status: 'success',
        data: flow  
      });
    } catch (error) {
      next(error);
    }
  }

  static async getFlowById(req, res,next) {
    try {
      const { flowId } = req.params;
      const flow = await ChatbotService.getFlowById(flowId);
      return res.status(200).json({
        status: 'success',
        data: flow
      });
    } catch (error) {
      next(error);
    }
  }
} 