import prisma from '../config/database.js';
import { config } from '../config/config.js';
import axios from 'axios';
import { responseError } from '../utils/error.js';
/**
 * Service untuk mengelola template WhatsApp
 */
export class TemplateService {
  static baseUrl = config.whatsapp.baseUrl;
  static apiVersion = config.whatsapp.apiVersion;
  static accessToken = config.whatsapp.accessToken;
  static wabaId = config.whatsapp.wabaId;

  /**
   * Membuat template baru
   * @param {string} userId - ID user
   * @param {Object} templateData - Data template
   * @returns {Promise<Object>} Template yang dibuat
   */
  static async createTemplate(userId, templateData) {
      return await prisma.waTemplate.create({
        data: {
          userId,
          name: `${templateData.name}_${Math.floor(100000 + Math.random() * 900000)}`,
          language: templateData.language,
          category: templateData.category,
          components: templateData.components,
          status: 'PENDING'
        }
      });
  }

  /**
   * Mengajukan template ke WhatsApp
   * @param {string} templateId - ID template yang akan diajukan
   * @returns {Promise<Object>} Template yang diajukan
   */
  static async submitTemplateToMeta(templateId) {
      // Ambil template dari database
      const template = await prisma.waTemplate.findUnique({
        where: { id: templateId },
        include: { user: true }
      });

      if (!template) {
        throw new responseError(404,'Template tidak ditemukan');
      }

      // Ambil WABA account user
      const wabaAccount = await prisma.waAccountDetail.findUnique({
        where: { userId: template.userId }
      });

      console.log(wabaAccount);
      

      if (!wabaAccount || !wabaAccount.wabaId) {
        throw new responseError(404,'WABA account tidak ditemukan');
      }

      // Format data untuk API Meta
      const metaData = {
        name: template.name,
        category: template.category,
        language: template.language,
        components: template.components
      };
      // Kirim ke API Meta
      const response = await axios.post(
        `${this.baseUrl}/${this.apiVersion}/${wabaAccount.wabaId}/message_templates`,
        metaData,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update status template di database
      return await prisma.waTemplate.update({
        where: { id: templateId },
        data: {
          status: 'SUBMITTED',
          metaTemplateId: response.data.id
        }
      });
  }

  /**
   * Mendapatkan semua template milik user
   * @param {string} userId - ID user
   * @param {string} status - Filter berdasarkan status (opsional)
   * @returns {Promise<Array>} List template
   */
  static async getTemplatesByUser(userId, status = undefined) {
      return await prisma.waTemplate.findMany({
        where: {
          AND : [
            { userId },
            {status : status}
          ]
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
  }

  /**
   * Mendapatkan template berdasarkan ID
   * @param {string} templateId - ID template
   * @returns {Promise<Object>} Template
   */
  static async getTemplateById(templateId) {
      return await prisma.waTemplate.findUnique({
        where: { id: templateId }
      });
  }

  /**
   * Mengupdate template
   * @param {string} templateId - ID template
   * @param {Object} updateData - Data yang akan diupdate
   * @returns {Promise<Object>} Template yang diupdate
   */
  static async updateTemplate(templateId, updateData) {
      const template = await this.getTemplateById(templateId);
      
      if (!template) {
        throw new responseError(404,'Template tidak ditemukan');
      }
      
      // Template yang sudah diajukan ke Meta tidak bisa diubah
      if (['SUBMITTED', 'APPROVED'].includes(template.status)) {
        throw new responseError(400,'Template yang sudah diajukan ke Meta tidak bisa diubah, silahkan buat template baru');
      }
      
      return await prisma.waTemplate.update({
        where: { id: templateId },
        data: updateData
      });
  }

  /**
   * Menghapus template
   * @param {string} templateId - ID template
   * @returns {Promise<Object>} Template yang dihapus
   */
  static async deleteTemplate(templateId) {
      // Cek apakah template ada
      const template = await this.getTemplateById(templateId);
      if (!template) {
        throw new responseError(404,'Template tidak ditemukan');
      }
      
      // Cek apakah template sedang digunakan di blast
      const blastCount = await prisma.waBlast.count({
        where: { templateId }
      });
      
      if (blastCount > 0) {
        throw new responseError(400,'Template tidak bisa dihapus karena sedang digunakan di blast');
      }

      console.log(template.name);
      
      
      // Hapus template dari Meta jika sudah diajukan
      if (template.status === 'APPROVED' && template.metaTemplateId) {
        await axios.delete(
          `${this.baseUrl}/${this.apiVersion}/${this.wabaId}/message_templates?hsm_id=${template.metaTemplateId}&name=${template.name}`,
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }
      
      return await prisma.waTemplate.delete({
        where: { id: templateId }
      });
  }

  /**
   * Menyinkronkan status template dari Meta
   * @param {string} templateId - ID template
   * @returns {Promise<Object>} Template yang diupdate
   */
  static async syncTemplateStatus(templateId) {
    try {
      const template = await this.getTemplateById(templateId);
      
      if (!template || !template.metaTemplateId) {
        throw new responseError(404,'Template tidak ditemukan atau belum diajukan ke Meta');
      }
      
      // Ambil WABA account user
      const wabaAccount = await prisma.waAccountDetail.findUnique({
        where: { userId: template.userId }
      });

      if (!wabaAccount || !wabaAccount.wabaId) {
        throw new responseError(404,'WABA account tidak ditemukan');
      }
      
      // Ambil status dari API Meta
      const response = await axios.get(
        `${this.baseUrl}/${this.apiVersion}/${wabaAccount.wabaId}/message_templates?name=${template.name}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.data && response.data.data.length > 0) {
        const metaTemplate = response.data.data[0];
        
        // Update status di database
        return await prisma.waTemplate.update({
          where: { id: templateId },
          data: {
            status: metaTemplate.status === 'APPROVED' ? 'APPROVED' : 
                   metaTemplate.status === 'REJECTED' ? 'REJECTED' : template.status,
            rejectionReason: metaTemplate.status === 'REJECTED' ? metaTemplate.quality_score.reason : null
          }
        });
      }
      
      return template;
    } catch (error) {
      console.error('Error syncing template status:', error);
      throw error;
    }
  }

  /**
   * Mendapatkan semua template langsung dari WhatsApp API Meta
   * @param {string} userId - ID user
   * @returns {Promise<Array>} List template dari Meta
   */
  static async getTemplatesFromMeta(userId) {
    // Ambil WABA account user
    const wabaAccount = await prisma.waAccountDetail.findUnique({
      where: { userId }
    });

    if (!wabaAccount || !wabaAccount.wabaId) {
      throw new responseError(404,'WABA account tidak ditemukan');
    }
    
    // Ambil semua template dari API Meta
    const response = await axios.get(
      `${this.baseUrl}/${this.apiVersion}/${wabaAccount.wabaId}/message_templates`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.data.data) {
      return [];
    }
    
    return response.data.data;
  }
} 