import { UserService } from '../services/user.service.js';
import { WhatsAppService } from '../services/whatsapp.service.js';
import { ChatbotService } from '../services/chatbot.service.js';
import { config } from '../config/config.js';
import prisma from '../config/database.js';

/**
 * Controller untuk WhatsApp API
 */
export class WhatsAppController {
  /**
   * Mengirim pesan teks
   */
  static async sendTextMessage(req, res, next) {
    try {
      const { id } = req.user;
      const { to, message } = req.body;
      
      // Validasi input
      if (!to || !message) {
        return res.status(400).json({
          status: 'error',
          message: 'Nomor tujuan dan pesan harus diisi'
        });
      }
      
      // Dapatkan informasi akun WA
      const waAccount = await UserService.getWhatsAppAccount(id);
      
      if (!waAccount.phoneNumberId) {
        return res.status(400).json({
          status: 'error',
          message: 'Nomor WhatsApp belum didaftarkan ke WABA'
        });
      }
      
      if (!waAccount.verified) {
        return res.status(400).json({
          status: 'error',
          message: 'Nomor WhatsApp belum diverifikasi'
        });
      }
      
      // Kirim pesan
      const sendResult = await WhatsAppService.sendTextMessage(
        waAccount.phoneNumberId,
        to,
        message
      );
      
      // Log pesan keluar
      await WhatsAppService.logOutgoingMessage(id, to, message, 'manual');
      
      return res.status(200).json({
        status: 'success',
        message: 'Pesan berhasil dikirim',
        data: sendResult
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Handler untuk webhook
   */
  static async handleWebhook(req, res, next) {
    try {
      // Verifikasi webhook jika ada challenge
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];
      
      if (mode === 'subscribe' && token === config.whatsapp.webhookVerifyToken) {
        return res.status(200).send(challenge);
      }
      // melakukan return agar meta tidak lama menunggu response
      
      
      // Jika bukan verifikasi, proses data webhook
      const { object, entry } = req.body;
      
      if (object === 'whatsapp_business_account') {
        for (const entryItem of entry) {
          for (const change of entryItem.changes) {
            if (change.field === 'messages') {
              const value = change.value;
              
              if (value?.messages && value.messages.length > 0) {
                const message = value.messages[0];
                const from = message.from; // Nomor pengirim
                // const messageBody = message.text?.body || '';
                const phoneNumberId = value.metadata.phone_number_id;
                
                // Cari user yang memiliki nomor WA ini
                const user = await prisma.waAccountDetail.findFirst({
                  where: { phoneNumberId: phoneNumberId }
                });
                
                if (user.phoneNumberId) {            
                  // Proses pesan dengan chatbot flow
                  await ChatbotService.processIncomingMessage(
                    user.userId,
                    from,
                    message,
                    phoneNumberId
                  );
                }
              }
            }
          }
        }
        res.status(200).json({ status: 'success' });
      }

    } catch (error) {
      next(error);
    }
  }

  /**
   * Mendapatkan informasi WABA
   */
  static async getWabaInfo(req, res, next) {
    try {
      const wabaId = config.whatsapp.wabaId;
      
      return res.status(200).json({
        status: 'success',
        data: {
          wabaId
        }
      });
    } catch (error) {
      next(error);
    }
  }
} 