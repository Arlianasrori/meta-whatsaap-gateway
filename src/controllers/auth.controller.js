import { UserService } from '../services/user.service.js';
import { config } from '../config/config.js';
import { AuthService } from '../services/auth.service.js';

/**
 * Controller untuk autentikasi user
 */
export class AuthController {
  /**
   * Register user baru
   */
  static async register(req, res, next) {
    try {
      const { name, phoneNumber, password, address, businessName } = req.body;
      
      const userData = { name, phoneNumber, password, address, businessName };
      const {user, accessToken, refreshToken} = await AuthService.register(userData);

      res.cookie('access_token', accessToken, config.jwt.cookie);
      res.cookie('refresh_token', refreshToken, config.jwt.refreshCookie);
      
      return res.status(201).json({
        status: 'success',
        message: 'Registrasi berhasil',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mendaftarkan nomor WhatsApp ke WABA
   */
  static async registerNumber(req, res, next) {
    try {
      const {id} = req.user;
      const { displayName, phoneNumber } = req.body;
      const wabaId = config.whatsapp.wabaId;
      
      // Daftarkan ke WABA melalui API
      const registerResult = await AuthService.registerPhoneNumber(
        id,
        wabaId, 
        displayName, 
        phoneNumber
      );
      
      return res.status(201).json({
        status: 'success',
        message: 'Nomor WhatsApp berhasil didaftarkan',
        data: registerResult
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Meminta kode verifikasi (OTP)
   */
  static async requestVerificationCode(req, res, next) {
    try {
      const { phoneNumber } = req.user;
      const { method = 'SMS', language = 'id' } = req.body;
      console.log(phoneNumber, method, language);
      // Request kode OTP
      const requestResult = await AuthService.requestVerificationCode(
        phoneNumber,
        method,
        language
      );
      
      return res.status(200).json({
        status: 'success',
        message: 'Permintaan kode verifikasi berhasil dikirim',
        data: requestResult
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Verifikasi kode OTP
   */
  static async verifyCode(req, res, next) {
    try {
      const { id } = req.user;
      const { code } = req.body;
      
      // Dapatkan informasi akun WA
      const waAccount = await UserService.getWhatsAppAccount(id);
      
      if (!waAccount.phoneNumberId) {
        return res.status(400).json({
          status: 'error',
          message: 'Nomor WhatsApp belum didaftarkan ke WABA'
        });
      }
      
      // Verifikasi kode OTP
      const verifyResult = await AuthService.verifyCode(
        waAccount.phoneNumberId,
        code
      );
      
      // Update status verifikasi di database
      await UserService.updateWhatsAppAccount(id, {
        verified: true,
        verificationCode: code
      });
      
      return res.status(200).json({
        status: 'success',
        message: 'Verifikasi nomor WhatsApp berhasil',
        data: verifyResult
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   */
  static async login(req, res, next) {
    try {
      const { phoneNumber, password } = req.body;
      
      const { user, accessToken, refreshToken } = await AuthService.login(phoneNumber, password);
      
      // Set cookies untuk tokens
      res.cookie('access_token', accessToken, config.jwt.cookie);
      res.cookie('refresh_token', refreshToken, config.jwt.refreshCookie);
      
      return res.status(200).json({
        status: 'success',
        message: 'Login berhasil',
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mendapatkan profil user
   */
  static async getProfile(req, res, next) {
    try {
      const { id } = req.user;
      const user = await UserService.getUserById(id);
      
      return res.status(200).json({
        status: 'success',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Update profil user
   */
  static async updateProfile(req, res, next) {
    try {
      const { id } = req.user;
      const { name, address, businessName } = req.body;
      
      const updateData = {};
      if (name) updateData.name = name;
      if (address) updateData.address = address;
      if (businessName) updateData.businessName = businessName;
      
      const updatedUser = await UserService.updateUser(id, updateData);
      
      return res.status(200).json({
        status: 'success',
        message: 'Profil berhasil diupdate',
        data: updatedUser
      });
    } catch (error) {
      if (error.message === 'User tidak ditemukan') {
        return next(new NotFoundError(error.message));
      }
      
      next(error);
    }
  }

  /**
   * Logout user
   */
  static async logout(req, res) {
    // Hapus cookies
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    
    return res.status(200).json({
      status: 'success',
      message: 'Logout berhasil'
    });
  }
} 