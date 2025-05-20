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
  static async checkAndDeductMessageQuota(userId) {
    // Periksa kuota pesan
    const quotaStatus = await packageService.checkUserMessageQuota(userId);
    
    if (!quotaStatus.hasQuota) {
      throw new Error(quotaStatus.message);
    }
    
    // Kurangi kuota pesan
    await packageService.recordMessageUsage(userId, 1);
    
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
    await this.checkAndDeductMessageQuota(userId);
    
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