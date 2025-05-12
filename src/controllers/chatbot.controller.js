import { ChatbotService } from '../services/chatbot.service.js';
import prisma from '../config/database.js';

/**
 * Controller untuk mengelola Chatbot flow
 */
export class ChatbotController {
  /**
   * Membuat flow chatbot baru
   */
  static async createFlow(req, res, next) {
    try {
      const { id , role} = req.user;

      if (role != 'USER') {
        return res.status(403).json({
          status: 'error',
          message: 'Hanya user yang dapat menambahkan flow chatbot'
        });
      }
      const { name, flowJson } = req.body;
      
      // Validasi format flowJson
      if (!flowJson.root) {
        return res.status(400).json({
          status: 'error',
          message: 'Flow harus memiliki node root'
        });
      }
      
      const flow = await ChatbotService.createFlow(id, name, flowJson);
      
      return res.status(201).json({
        status: 'success',
        message: 'Flow chatbot berhasil dibuat',
        data: flow
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Mendapatkan semua flow chatbot milik user
   */
  static async getFlows(req, res, next) {
    try {
      const { id } = req.user;
      
      const flows = await ChatbotService.getFlowsByUser(id);
      
      return res.status(200).json({
        status: 'success',
        data: flows
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Mendapatkan detail flow chatbot
   */
  static async getFlowById(req, res, next) {
    try {
      const { id } = req.user;
      const { flowId } = req.params;
      
      const flow = await ChatbotService.getFlowById(flowId);
      
      if (!flow) {
        return res.status(404).json({
          status: 'error',
          message: 'Flow chatbot tidak ditemukan'
        });
      }
      
      // Cek kepemilikan
      if (flow.userId !== id) {
        return res.status(403).json({
          status: 'error',
          message: 'Anda tidak memiliki akses ke flow ini'
        });
      }
      
      return res.status(200).json({
        status: 'success',
        data: flow
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Mengupdate flow chatbot
   */
  static async updateFlow(req, res, next) {
    try {
      const { id } = req.user;
      const { flowId } = req.params;
      const { name, flowJson, isActive } = req.body;
      
      // Cek kepemilikan flow
      const existingFlow = await ChatbotService.getFlowById(flowId);
      
      if (!existingFlow) {
        return res.status(404).json({
          status: 'error',
          message: 'Flow chatbot tidak ditemukan'
        });
      }
      
      if (existingFlow.userId !== id) {
        return res.status(403).json({
          status: 'error',
          message: 'Anda tidak memiliki akses ke flow ini'
        });
      }
      
      // Validasi format flowJson jika ada
      if (flowJson && !flowJson.root) {
        return res.status(400).json({
          status: 'error',
          message: 'Flow harus memiliki node root'
        });
      }
      
      // Update flow
      const updatedFlow = await ChatbotService.updateFlow(flowId, {
        name,
        flowJson,
        isActive
      });
      
      return res.status(200).json({
        status: 'success',
        message: 'Flow chatbot berhasil diupdate',
        data: updatedFlow
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Menghapus flow chatbot
   */
  static async deleteFlow(req, res, next) {
    try {
      const { id } = req.user;
      const { flowId } = req.params;
      
      // Cek kepemilikan flow
      const existingFlow = await ChatbotService.getFlowById(flowId);
      
      if (!existingFlow) {
        return res.status(404).json({
          status: 'error',
          message: 'Flow chatbot tidak ditemukan'
        });
      }
      
      if (existingFlow.userId !== id) {
        return res.status(403).json({
          status: 'error',
          message: 'Anda tidak memiliki akses ke flow ini'
        });
      }
      
      // Hapus flow
      await ChatbotService.deleteFlow(flowId);
      
      return res.status(200).json({
        status: 'success',
        message: 'Flow chatbot berhasil dihapus'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Mengaktifkan flow chatbot
   */
  static async activateFlow(req, res, next) {
    try {
      const { id : userID} = req.user;
      const { flowId } = req.params;
      
      // Cek kepemilikan flow
      const existingFlow = await ChatbotService.getFlowById(flowId);
      
      if (!existingFlow) {
        return res.status(404).json({
          status: 'error',
          message: 'Flow chatbot tidak ditemukan'
        });
      }
      
      if (existingFlow.userId !== userID) {
        return res.status(403).json({
          status: 'error',
          message: 'Anda tidak memiliki akses ke flow ini'
        });
      }
      
      // Aktifkan flow yang dipilih
      const activatedFlow = await ChatbotService.updateFlow(flowId, { isActive: true });

      await prisma.chatFlow.updateMany({
        where: {
          userId : userID,
          NOT : {
            id : flowId
          }
        },
        data: { isActive: false }
      })
      
      return res.status(200).json({
        status: 'success',
        message: 'Flow chatbot berhasil diaktifkan',
        data: activatedFlow
      });
    } catch (error) {
      next(error);
    }
  }
} 