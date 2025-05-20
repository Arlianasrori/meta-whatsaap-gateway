import { UserService } from '../services/user.service.js';
import { WhatsAppService } from '../services/whatsapp.service.js';
import { ChatbotService } from '../services/chatbot.service.js';
import { config } from '../config/config.js';
import prisma from '../config/database.js';
import { addImageFile, addDocumentFile } from '../utils/fileUtils.js';

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
      
      // Kirim pesan (termasuk pengecekan kuota)
      const sendResult = await WhatsAppService.sendTextMessage(
        id, // UserID untuk pengecekan kuota
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
      next(error)
    }
  }

  /**
   * Mengirim pesan button
   */
  static async sendButtonMessage(req, res, next) {
    try {
      const { id } = req.user;
      const reqBody = req.body;
      
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
      
      // Kirim pesan (termasuk pengecekan kuota)
      const sendResult = await WhatsAppService.sendButtonMessage(
        id, // UserID untuk pengecekan kuota
        waAccount.phoneNumberId,
        reqBody.to,
        reqBody
      );
      
      // Log pesan keluar
      await WhatsAppService.logOutgoingMessage(id, reqBody.to, `${reqBody.text} : ${reqBody.buttons.map(button => button.title).join(', ')}`, 'manual');
      
      return res.status(200).json({
        status: 'success',
        message: 'Pesan berhasil dikirim',
        data: sendResult
      });
    } catch (error) {
      next(error)
    }
  }

  /**
   * Mengirim pesan list
   */
  static async sendListMessage(req, res, next) {
    try {
      const { id } = req.user;
      const reqBody = req.body;
      
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
      
      // Kirim pesan (termasuk pengecekan kuota)
      const sendResult = await WhatsAppService.sendListMessage(
        id, // UserID untuk pengecekan kuota
        waAccount.phoneNumberId,
        reqBody.to,
        reqBody
      );
      
      // Log pesan keluar
      await WhatsAppService.logOutgoingMessage(id, reqBody.to, `${reqBody.header} : ${reqBody.body} : ${reqBody.buttonText} : ${reqBody.sections.map(section => section.title).join(', ')}`, 'manual');
      
      return res.status(200).json({
        status: 'success',
        message: 'Pesan berhasil dikirim',
        data: sendResult
      });
    } catch (error) {
      next(error)
    }
  }

  /**
   * Mengirim pesan image
   */
  static async sendImageMessage(req, res, next) {
    try {
      const { id } = req.user;
      const reqBody = req.body;
      const file = req.files?.image
      console.log(file);
      
      
      if (!file) {
        return res.status(400).json({
          status: 'error',
          message: 'Image is required',
        });
      }
      
      const url = `${req.protocol}://${req.get("host")}/images/`

      const fileUrl = await addImageFile(file,url)

      
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
      
      // Kirim pesan (termasuk pengecekan kuota)
      const sendResult = await WhatsAppService.sendImageMessage(
        id, // UserID untuk pengecekan kuota
        waAccount.phoneNumberId,
        reqBody.to,
        {
          caption: reqBody.image_caption,
          image_url: fileUrl
        }
      );
      
      // Log pesan keluar
      await WhatsAppService.logOutgoingMessage(id, reqBody.to, `${reqBody.image_caption} : ${fileUrl}`, 'manual');
      
      return res.status(200).json({
        status: 'success',
        message: 'Pesan berhasil dikirim',
        data: sendResult
      });
    } catch (error) {
      next(error)
    }
  }

  /**
   * Mengirim pesan document
   */
  static async sendDocumentMessage(req, res, next) {
    try {
      const { id } = req.user;
      const reqBody = req.body; 
      const file = req.files?.document

      if (!file) {
        return res.status(400).json({
          status: 'error',
          message: 'Document is required',
        });
      }
      
      const url = `${req.protocol}://${req.get("host")}/documents/`

      const fileUrl = await addDocumentFile(file,url)

      
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
      
      // Kirim pesan (termasuk pengecekan kuota)
      const sendResult = await WhatsAppService.sendDocumentMessage(
        id, // UserID untuk pengecekan kuota
        waAccount.phoneNumberId,
        reqBody.to,
        {
          file_name: reqBody.file_name,
          document_url: fileUrl
        }
      );
      
      // Log pesan keluar
      await WhatsAppService.logOutgoingMessage(id, reqBody.to, `${reqBody.file_name} : ${fileUrl}`, 'manual');
      
      return res.status(200).json({
        status: 'success',
        message: 'Pesan berhasil dikirim',
        data: sendResult
      });
    } catch (error) {
      next(error)
    }
  }

  /**
   * Mengirim pesan location
   */
  static async sendLocationMessage(req, res, next) {
    try {
      const { id } = req.user;
      const reqBody = req.body;
      
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
      
      // Kirim pesan (termasuk pengecekan kuota)
      const sendResult = await WhatsAppService.sendLocationMessage(
        id, // UserID untuk pengecekan kuota
        waAccount.phoneNumberId,
        reqBody.to,
        reqBody
      );
      
      // Log pesan keluar
      await WhatsAppService.logOutgoingMessage(id, reqBody.to, `latitude : ${reqBody.latitude}, longitude :  ${reqBody.longitude}, addreas : ${reqBody.addreas}, name : ${reqBody.name}`, 'manual');
      
      return res.status(200).json({
        status: 'success',
        message: 'Pesan berhasil dikirim',
        data: sendResult
      });
    } catch (error) {
      next(error)
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
                
                if (user?.phoneNumberId) {
                  try {
                    // Cek kuota pesan sebelum memproses pesan (untuk balasan otomatis)
                    await WhatsAppService.checkAndDeductMessageQuota(user.userId);
                    
                    // Proses pesan dengan chatbot flow
                    await ChatbotService.processIncomingMessage(
                      user.userId,
                      from,
                      message,
                      phoneNumberId
                    );
                  } catch (quotaError) {
                    console.error(`Quota error for user ${user.userId}:`, quotaError.message);
                    // Kirim notifikasi kuota habis (tidak mengurangi kuota)
                    await WhatsAppService.sendTextMessage(
                      user.phoneNumberId,
                      from,
                      "Maaf, kuota pesan Anda telah habis. Silahkan beli paket baru untuk melanjutkan menggunakan layanan ini."
                    );
                  }
                }
              }
            }
          }
        }
        res.status(200).json({ status: 'success' });
      }

    } catch (error) {
      // Tetap mengembalikan status 200 agar Meta tidak mencoba ulang
      console.error('Webhook error:', error);
      res.status(200).json({ status: 'error', message: error.message });
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