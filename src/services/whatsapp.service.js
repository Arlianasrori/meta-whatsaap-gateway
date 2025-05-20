import axios from 'axios';
import prisma from '../config/database.js';
import { config } from '../config/config.js';
import { responseError } from '../utils/error.js';
import packageService from './package.service.js';

/**
 * Service untuk interaksi dengan WhatsApp API
 */
export class WhatsAppService {
  static baseUrl = config.whatsapp.baseUrl;
  static apiVersion = config.whatsapp.apiVersion;
  static accessToken = config.whatsapp.accessToken;
    /**
   * Melihat nomor yang terdaftar di WABA
   * @returns {Promise<Object>} Hasil pendaftaran dari API
   */
  static async getAllNUmberOnWaba() {
      const url = `${this.baseUrl}/${this.apiVersion}/${config.whatsapp.wabaId}/phone_numbers`;

      const response = await axios.get(url,
          {
          headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
          }
      });

      return response.data;
  }

  /**
   * Memeriksa kuota pesan dan menguranginya jika valid
   * @param {string} userId - ID User
   * @returns {Promise<Object>} Status kuota pesan
   */
  static async checkMessageQuota(userId) {
    // Periksa kuota pesan
    const quotaStatus = await packageService.checkUserMessageQuota(userId);
    
    if (!quotaStatus.hasQuota) {
      throw new responseError(400,quotaStatus.message);
    }
    
    return {
      success: true,
      message: quotaStatus.message
    };
  }

  /**
   * Mengirim pesan teks
   * @param {string} userId - ID User
   * @param {string} phoneNumberId - ID nomor telepon pengirim
   * @param {string} to - Nomor telepon penerima (tanpa +)
   * @param {string} message - Isi pesan
   * @returns {Promise<Object>} Response dari API
   */
  static async sendTextMessage(userId, phoneNumberId, to, message) {
    // Periksa dan kurangi kuota pesan
    // await this.checkMessageQuota(userId);
    
    const url = `${this.baseUrl}/${this.apiVersion}/${phoneNumberId}/messages`;
    
    const response = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: {
          body: message
        }
      },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // packageService.recordMessageUsage(userId, 1);
    
    return response.data;
  }

  /**
   * Mengirim pesan button
   * @param {string} userId - ID User
   * @param {string} phoneNumberId - ID nomor telepon pengirim
   * @param {string} to - Nomor telepon penerima (tanpa +)
   * @param {string} message - Isi pesan
   * @returns {Promise<Object>} Response dari API
   */
  static async sendButtonMessage(userId, phoneNumberId, to, message) {
    // Periksa dan kurangi kuota pesan
    // await this.checkMessageQuota(userId);
    
    const url = `${this.baseUrl}/${this.apiVersion}/${phoneNumberId}/messages`;
    
    const response = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        to: to,
        type : "interactive",
        interactive : {
          type: 'button',
          body : {text : message.text},
          action : {
            buttons : message.buttons.map(button => {
              return {
                type : button.type,
                reply : {id : button.id,title : button.title}
              }
            })
          },
        }     
      },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // packageService.recordMessageUsage(userId, 1);
    
    return response.data;
  }

  /**
   * Mengirim pesan list
   * @param {string} userId - ID User
   * @param {string} phoneNumberId - ID nomor telepon pengirim
   * @param {string} to - Nomor telepon penerima (tanpa +)
   * @param {string} message - Isi pesan
   * @returns {Promise<Object>} Response dari API
   */
  static async sendListMessage(userId, phoneNumberId, to, message) {
    // Periksa dan kurangi kuota pesan
    // await this.checkMessageQuota(userId);
    
    const url = `${this.baseUrl}/${this.apiVersion}/${phoneNumberId}/messages`;
    
    const response = await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        to: to,
        type: "interactive",
        interactive: {
          type: "list",
          header: {
            type: "text",
            text: message.header
          },
          body: {
            text: message.body
          },
          footer: {
            text: message.footer
          },
          action: {
            button: message.buttonText,
            sections: message.sections.map(section => {
              return {
                title : section.title,
                rows : section.rows.map(row => {
                  return {
                    id: row.id,
                    title: row.title,
                    description: row.description
                  }
                })
              }
            })
          }
        }
      },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // packageService.recordMessageUsage(userId, 1);
    
    return response.data;
  }

  /**
   * Mengirim pesan image
   * @param {string} userId - ID User
   * @param {string} phoneNumberId - ID nomor telepon pengirim
   * @param {string} to - Nomor telepon penerima (tanpa +)
   * @param {string} message - Isi pesan
   * @returns {Promise<Object>} Response dari API
   */
  static async sendImageMessage(userId, phoneNumberId, to, message) {
    // Periksa dan kurangi kuota pesan
    // await this.checkMessageQuota(userId);
    
    const url = `${this.baseUrl}/${this.apiVersion}/${phoneNumberId}/messages`;
    
    const response = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'image',
        image: {
          link: message.image_url,
          caption: message.caption
        }
      },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // packageService.recordMessageUsage(userId, 1);
    
    return response.data;
  }

  /**
   * Mengirim pesan document
   * @param {string} userId - ID User
   * @param {string} phoneNumberId - ID nomor telepon pengirim
   * @param {string} to - Nomor telepon penerima (tanpa +)
   * @param {string} message - Isi pesan
   * @returns {Promise<Object>} Response dari API
   */
  static async sendDocumentMessage(userId, phoneNumberId, to, message) {
    // Periksa dan kurangi kuota pesan
    // await this.checkMessageQuota(userId);
    
    const url = `${this.baseUrl}/${this.apiVersion}/${phoneNumberId}/messages`;
    
    const response = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'document',
        document: {
          link: message.document_url,
          caption: message.file_name
        }
      },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // packageService.recordMessageUsage(userId, 1);
    
    return response.data;
  }

  /**
   * Mengirim pesan location
   * @param {string} userId - ID User
   * @param {string} phoneNumberId - ID nomor telepon pengirim
   * @param {string} to - Nomor telepon penerima (tanpa +)
   * @param {string} message - Isi pesan
   * @returns {Promise<Object>} Response dari API
   */
  static async sendLocationMessage(userId, phoneNumberId, to, message) {
    // Periksa dan kurangi kuota pesan
    // await this.checkMessageQuota(userId);
    
    const url = `${this.baseUrl}/${this.apiVersion}/${phoneNumberId}/messages`;
    
    const response = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'location',
        location: message.location
      },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      } 
    );

    // packageService.recordMessageUsage(userId, 1);
    
    return response.data;
  }

  /**
   * Mencatat incoming message ke database
   * @param {string} userId - ID user pemilik akun WA
   * @param {string} waNumber - Nomor WhatsApp pengirim
   * @param {string} message - Isi pesan
   * @param {string} currentState - State percakapan saat ini
   * @returns {Promise<Object>} Data log yang tersimpan
   */
  static async logIncomingMessage(userId, waNumber, message, currentState) {
    return await prisma.chatLog.create({
      data: {
        userId,
        waNumber,
        direction: 'IN',
        message,
        currentState
      }
    });
  }

  /**
   * Mencatat outgoing message ke database
   * @param {string} userId - ID user pemilik akun WA
   * @param {string} waNumber - Nomor WhatsApp penerima
   * @param {string} message - Isi pesan
   * @param {string} currentState - State percakapan saat ini
   * @returns {Promise<Object>} Data log yang tersimpan
   */
  static async logOutgoingMessage(userId, waNumber, message, currentState) {
    return await prisma.chatLog.create({
      data: {
        userId,
        waNumber,
        direction: 'OUT',
        message,
        currentState
      }
    });
  }

  static async getAllLogMessage(userId) {
    return await prisma.chatLog.findMany({
      where: { userId }
    });
  }
} 