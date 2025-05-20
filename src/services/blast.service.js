import prisma from '../config/database.js';
import { config } from '../config/config.js';
import axios from 'axios';
import packageService from './package.service.js';
import { TemplateService } from './template.service.js';
import { scheduleBlast, cancelScheduledBlast } from '../config/queue.js';
import { responseError } from '../utils/error.js';

/**
 * Service untuk mengelola blast WhatsApp
 */
export class BlastService {
  static baseUrl = config.whatsapp.baseUrl;
  static apiVersion = config.whatsapp.apiVersion;
  static accessToken = config.whatsapp.accessToken;

  /**
   * Membuat blast baru
   * @param {string} userId - ID user
   * @param {Object} blastData - Data blast
   * @returns {Promise<Object>} Blast yang dibuat
   */
  static async createBlast(userId, blastData) {
    // Validasi template
    const template = await TemplateService.getTemplateById(blastData.templateId);
    
    if (!template) {
      throw new responseError(404,'Template tidak ditemukan');
    }
    
    if (template.userId !== userId) {
      throw new responseError(403,'Template bukan milik user ini');
    }
    
    if (template.status !== 'APPROVED') {
      throw new responseError(400,'Hanya template berstatus APPROVED yang bisa digunakan');
    }
    
    // Hapus duplikat nomor penerima
    const uniqueRecipients = [...new Set(blastData.recipients)];
    
    // Hitung total penerima
    const totalRecipients = uniqueRecipients.length;

    // Tentukan status (DRAFT / SCHEDULED)
    const isScheduled = blastData.scheduledAt;
    const status = isScheduled ? 'SCHEDULED' : 'DRAFT';
    
    // Format scheduledAt jika ada
    const scheduledAt = blastData.scheduledAt ? new Date(blastData.scheduledAt) : null;
    
    // Buat blast baru
    const blast = await prisma.waBlast.create({
      data: {
        userId,
        templateId: blastData.templateId,
        name: blastData.name,
        status,
        recipients: uniqueRecipients,
        parameters: blastData.parameters || {},
        recipientParameters: blastData.recipientParameters || {},
        scheduledAt,
        totalRecipients
      }
    });

    // Jika blast dijadwalkan, tambahkan ke queue
    if (isScheduled) {
      try {
        scheduleBlast(blast.id, scheduledAt);
        console.log(`📅 Blast dijadwalkan: ${blast.id} pada ${scheduledAt}`);
      } catch (queueError) {
        console.error('Error saat penjadwalan blast:', queueError);
        // Jika gagal masuk ke queue, tetap lanjutkan
        // Status tetap SCHEDULED dan akan di-cek oleh worker saat startup
      }
    }
    
    return blast;
  }

  /**
   * Mendapatkan semua blast milik user
   * @param {string} userId - ID user
   * @param {string} status - Filter berdasarkan status (opsional)
   * @returns {Promise<Array>} List blast
   */
  static async getBlastsByUser(userId, status = null) {
    const whereClause = { userId };
    
    if (status) {
      whereClause.status = status;
    }
    
    return await prisma.waBlast.findMany({
      where: whereClause,
      include: {
        template: {
          select: {
            name: true,
            language: true,
            category: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Mendapatkan blast berdasarkan ID
   * @param {string} blastId - ID blast
   * @returns {Promise<Object>} Blast
   */
  static async getBlastById(blastId) {
    return await prisma.waBlast.findUnique({
      where: { id: blastId },
      include: {
        template: true
      }
    });
  }

  /**
   * Mengupdate blast
   * @param {string} blastId - ID blast
   * @param {Object} updateData - Data yang akan diupdate
   * @returns {Promise<Object>} Blast yang diupdate
   */
  static async updateBlast(blastId, updateData) {
    const blast = await this.getBlastById(blastId);
    
    if (!blast) {
      throw new responseError(404,'Blast tidak ditemukan');
    }
    
    // Blast yang sudah diproses tidak bisa diubah
    if (['PROCESSING', 'COMPLETED', 'FAILED'].includes(blast.status)) {
      throw new responseError(400,'Blast yang sudah diproses tidak bisa diubah');
    }

    let data = { ...updateData };
    let needsReschedule = false;
    let newScheduledAt = null;
    
    // Jika ada perubahan recipients, recalculate totalRecipients
    if (updateData.recipients) {
      const uniqueRecipients = [...new Set(updateData.recipients)];
      data.recipients = uniqueRecipients;
      data.totalRecipients = uniqueRecipients.length;
    }
    
    // Jika ada scheduledAt, konversi ke Date dan update status
    if (updateData.scheduledAt) {
      newScheduledAt = new Date(updateData.scheduledAt);
      data.scheduledAt = newScheduledAt;
      data.status = 'SCHEDULED';
      needsReschedule = true;
    }
    
    // Update data blast di database
    const updatedBlast = await prisma.waBlast.update({
      where: { id: blastId },
      data
    });

    // Jika ada perubahan jadwal, perbarui juga di queue
    if (needsReschedule) {
      // Hapus job lama jika ada
      cancelScheduledBlast(blastId);
      
      // Buat job baru
      scheduleBlast(blastId, newScheduledAt);
      console.log(`📅 Blast dijadwalkan ulang: ${blastId} pada ${newScheduledAt}`);
    }
    
    return updatedBlast;
  }

  /**
   * Menghapus blast
   * @param {string} blastId - ID blast
   * @returns {Promise<Object>} Blast yang dihapus
   */
  static async deleteBlast(blastId) {
    const blast = await this.getBlastById(blastId);
    
    if (!blast) {
      throw new responseError(404,'Blast tidak ditemukan');
    }
    
    // Blast yang sedang diproses tidak bisa dihapus
    if (blast.status === 'PROCESSING') {
      throw new responseError(400,'Blast yang sedang diproses tidak bisa dihapus');
    }
    
    // Hapus job dari queue jika blast dijadwalkan
    if (blast.status === 'SCHEDULED') {
      cancelScheduledBlast(blastId);
    }
    
    return await prisma.waBlast.delete({
      where: { id: blastId }
    });
  }

  /**
   * Kirim pesan blast
   * @param {string} blastId - ID blast
   * @returns {Promise<Object>} Hasil pengiriman
   */
  static async sendBlast(blastId) {
    try {
      const blast = await this.getBlastById(blastId);
      
      if (!blast) {
        throw new responseError(404,'Blast tidak ditemukan');
      }
      
      // await packageService.checkUserMessageQuota(blast.userId);

      // Validasi status blast
      if (blast.status !== 'DRAFT' && blast.status !== 'SCHEDULED') {
        throw new responseError(400,`Blast tidak bisa dikirim karena status blast saat ini ${blast.status}`);
      }
      console.log(blast.scheduledAt,new Date());
      
      // Jika terjadwal tapi belum waktunya, jangan kirim
      if (blast.status === 'SCHEDULED' && blast.scheduledAt > new Date()) {
        throw new responseError(400,'Blast dijadwalkan untuk dikirim nanti');
      }
      
      // Update status jadi PROCESSING
      // await prisma.waBlast.update({
      //   where: { id: blastId },
      //   data: { status: 'PROCESSING' }
      // });
      
      // Ambil WABA account
      const wabaAccount = await prisma.waAccountDetail.findUnique({
        where: { userId: blast.userId }
      });
      
      if (!wabaAccount || !wabaAccount.phoneNumberId) {
        throw new responseError(404,'Akun WhatsApp Business tidak ditemukan');
      }
      
      // Kirim pesan ke semua penerima
      const recipients = Array.isArray(blast.recipients) ? blast.recipients : [];
      let sentCount = 0;
      let failedCount = 0;
      
      const globalParameters = blast.parameters || {};
      const recipientParameters = blast.recipientParameters || {};
      
      for (const recipient of recipients) {
        try {
          // Siapkan payload template
          const payload = {
            messaging_product: 'whatsapp',
            to: recipient,
            type: 'template',
            template: {
              name: blast.template.name,
              language: { code: blast.template.language },
              components: []
            }
          };
          
          // Cek apakah ada parameter khusus untuk nomor ini
          const hasSpecificParameters = recipientParameters[recipient] && Object.keys(recipientParameters[recipient]).length > 0;
          
          // Pilih parameter yang akan digunakan (spesifik atau global)
          const parameters = hasSpecificParameters ? recipientParameters[recipient] : globalParameters;
          
          // Tambahkan parameter jika ada
          if (Object.keys(parameters).length > 0) {
            // Format parameter sesuai komponen
            const components = [];
            
            // Tambahkan komponen header jika ada
            if (parameters.header) {
              components.push({
                type: 'header',
                parameters: parameters.header.map(param => {
                  if (param.startsWith('http')) {
                    return { type: 'image', image: { link: param } };
                  } else {
                    return { type: 'text', text: param };
                  }
                })
              });
            }
            
            // Tambahkan komponen body jika ada
            if (parameters.body) {
              components.push({
                type: 'body',
                parameters: parameters.body.map(param => ({ type: 'text', text: param }))
              });
            }
            
            // Tambahkan komponen ke payload
            if (components.length > 0) {
              payload.template.components = components;
            }
          }

          console.log(payload.template.components[0]);
          
          
          // Kirim pesan
          await axios.post(
            `${this.baseUrl}/${this.apiVersion}/${wabaAccount.phoneNumberId}/messages`,
            payload,
            {
              headers: {
                Authorization: `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          sentCount++;
          // await packageService.recordMessageUsage(blast.userId, 1);
          
          // Rate limiting sederhana - tambahkan delay 200ms antar pengiriman
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          failedCount++;
          throw new responseError(500,`Error sending message to ${recipient}: ${error.isAxiosError ? error.response.data.error.message : error.message}`);
        }
      }
      
      // Update status dan statistik
      const status = failedCount === recipients.length ? 'FAILED' : 
                    sentCount === recipients.length ? 'COMPLETED' : 'COMPLETED';
                    
      return await prisma.waBlast.update({
        where: { id: blastId },
        data: {
          status,
          sentCount,
          failedCount,
          completedAt: new Date()
        }
      });
    } catch (error) {
      
      // Update status jadi FAILED
      // await prisma.waBlast.update({
      //   where: { id: blastId },
      //   data: { 
      //     status: 'FAILED',
      //     completedAt: new Date()
      //   }
      // });
      
      throw error;
    }
  }

  /**
   * Batalkan blast yang terjadwal
   * @param {string} blastId - ID blast
   * @returns {Promise<Object>} Blast yang dibatalkan
   */
  static async cancelBlast(blastId) {
    const blast = await this.getBlastById(blastId);
    
    if (!blast) {
      throw new responseError(404,'Blast tidak ditemukan');
    }
    
    // Hanya blast dengan status SCHEDULED yang bisa dibatalkan
    if (blast.status !== 'SCHEDULED') {
      throw new responseError(400,'Hanya blast terjadwal yang bisa dibatalkan');
    }
    
    // Hapus dari queue
    await cancelScheduledBlast(blastId);
    
    // Update status di database
    return await prisma.waBlast.update({
      where: { id: blastId },
      data: { status: 'CANCELLED' }
    });
  }
} 