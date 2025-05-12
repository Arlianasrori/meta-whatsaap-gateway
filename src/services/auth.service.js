import prisma from '../config/database.js';
import { hashPassword, comparePassword, generateToken, generateRefreshToken } from '../utils/auth.js';
import {responseError} from '../utils/error.js';
import axios from 'axios';
import { config } from '../config/config.js';
import { WhatsAppService } from './whatsapp.service.js';
/**
 * Service untuk mengelola user dan WhatsApp Account
 */

export class AuthService {
  static baseUrl = config.whatsapp.baseUrl;
  static apiVersion = config.whatsapp.apiVersion;
  static accessToken = config.whatsapp.accessToken;
  static wabaId = config.whatsapp.wabaId;
  /**
   * Registrasi user baru
   * @param {Object} userData - Data user baru
   * @returns {Promise<Object>} User yang dibuat (tanpa password)
   */
  static async register(userData) {
    const { name, phoneNumber, password, address, businessName } = userData;
    
    // Cek apakah nomor telepon sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber }
    });
    
    if (existingUser) {
      throw new responseError(400, 'Nomor telepon sudah terdaftar');
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Buat user baru
    const newUser = await prisma.user.create({
      data: {
        name,
        phoneNumber,
        password: hashedPassword,
        address,
        businessName,
        role : 'USER'
      }
    });

    await prisma.waAccountDetail.create({
      data : {
        phoneNumber : phoneNumber,
        userId : newUser.id,
        displayName : name,
        wabaId : this.wabaId,
      }
    })

    // Generate access token dan refresh token
    const tokenPayload = {
      id: newUser.id,
      role: newUser.role
    };
    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    
    // Return user tanpa password
    const { password: _, ...userWithoutPassword } = newUser;
    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken
    };
  }

  /**
   * Login user
   * @param {string} phoneNumber - Nomor telepon user
   * @param {string} password - Password user
   * @returns {Promise<Object>} User, access token, dan refresh token
   */
  static async login(phoneNumber, password) {
    // Cari user berdasarkan nomor telepon
    const user = await prisma.user.findUnique({
      where: { phoneNumber }
    });
    
    if (!user) {
      throw new responseError(404, 'User tidak ditemukan');
    }
    
    // Verifikasi password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new responseError(401, 'Password salah');
    }
    
    // Payload untuk token
    const tokenPayload = {
      id: user.id,
      role: user.role
    };
    
    // Generate access token dan refresh token
    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    
    // Return user tanpa password
    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken
    };
  }

  /**
   * Mendaftarkan nomor WhatsApp ke WABA
   * @param {string} wabaId - WhatsApp Business Account ID
   * @param {string} displayName - Nama yang ditampilkan
   * @param {string} phoneNumber - Nomor telepon (+628xxx)
   * @returns {Promise<Object>} Hasil pendaftaran dari API
   */
  static async registerPhoneNumber(userId, wabaId, displayName, phoneNumber) {
    const url = `${this.baseUrl}/${this.apiVersion}/${wabaId}/phone_numbers`;
    console.log(url);
    
    
    const response = await axios.post(
      url,
      {
        cc: '62',
        phone_number: phoneNumber,
        display_name: displayName,
        verified_name: displayName
      },
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = response.data;

    await prisma.waAccountDetail.update({
      where : {
        userId : userId
      },
      data : {
        phoneNumberId : data.id,
        wabaId : wabaId,
        displayName : displayName,
        verified : false
      }
    })

    return data;
  }

  /**
   * Meminta kode OTP untuk verifikasi
   * @param {string} phoneNumberId - ID nomor telepon dari API
   * @param {string} method - Metode pengiriman (SMS/VOICE)
   * @param {string} language - Kode bahasa (id)
   * @returns {Promise<Object>} Response dari API
   */
  static async requestVerificationCode(phoneNumber, method = 'SMS', language = 'id') {
    const allNumbersInsideWaba = await WhatsAppService.getAllNUmberOnWaba();

    const result = allNumbersInsideWaba.data.find(item => item.display_phone_number === phoneNumber);

    if (!result) {
      throw new responseError(404, 'Nomor tidak ditemukan di WABA');
    }

    const url = `${this.baseUrl}/${this.apiVersion}/${result.id}/request_code`;
    
    const response = await axios.post(
      url,
      {
        code_method: method,
        language: language
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
   * Verifikasi kode OTP
   * @param {string} phoneNumberId - ID nomor telepon dari API
   * @param {string} code - Kode OTP yang diterima
   * @returns {Promise<Object>} Response dari API
   */
  static async verifyCode(code) {
      const allNumbersInsideWaba = await this.getAllNUmberOnWaba();

      const result = allNumbersInsideWaba.data.find(item => item.display_phone_number === phoneNumber);

      if (!result) {
        throw new responseError(404, 'Nomor tidak ditemukan di WABA');
      }
      const url = `${this.baseUrl}/${this.apiVersion}/${result.id}/verify_code`;
      
      const response = await axios.post(
        url,
        { code },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
  }
}