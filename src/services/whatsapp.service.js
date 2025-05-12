import axios from 'axios';
import prisma from '../config/database.js';
import { config } from '../config/config.js';
import { responseError } from '../utils/error.js';

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
   * Mengirim pesan teks
   * @param {string} phoneNumberId - ID nomor telepon pengirim
   * @param {string} to - Nomor telepon penerima (tanpa +)
   * @param {string} message - Isi pesan
   * @returns {Promise<Object>} Response dari API
   */
  static async sendTextMessage(phoneNumberId, to, message) {
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