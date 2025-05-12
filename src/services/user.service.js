import prisma from '../config/database.js';
import { hashPassword, comparePassword, generateToken, generateRefreshToken } from '../utils/auth.js';
import { responseError } from '../utils/error.js';

/**
 * Service untuk mengelola user dan WhatsApp Account
 */
export class UserService {
  /**
   * Mendapatkan user berdasarkan ID
   * @param {string} userId - ID user
   * @returns {Promise<Object>} Data user
   */
  static async getUserById(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      throw new responseError(404, 'User tidak ditemukan');
    }
    
    // Return user tanpa password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Mengupdate data user
   * @param {string} userId - ID user
   * @param {Object} updateData - Data yang akan diupdate
   * @returns {Promise<Object>} User yang diupdate
   */
  static async updateUser(userId, updateData) {
    await this.getUserById(userId)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });
    
    // Return user tanpa password
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Update detail akun WhatsApp
   * @param {string} userId - ID user
   * @param {Object} updateData - Data yang akan diupdate
   * @returns {Promise<Object>} Detail akun WA yang diupdate
   */
  static async updateWhatsAppAccount(userId, updateData) {
    await this.getWhatsAppAccount(userId)
    const existingAccount = await prisma.waAccountDetail.findUnique({
      where: { userId }
    });
      
    if (!existingAccount) {
      throw new Error('Akun WhatsApp tidak ditemukan');
    }
    
    return await prisma.waAccountDetail.update({
      where: { userId },
      data: updateData
    });
  }

  /**
   * Mendapatkan detail akun WhatsApp user
   * @param {string} userId - ID user
   * @returns {Promise<Object>} Detail akun WA
   */
  static async getWhatsAppAccount(userId) {
    const account = await prisma.waAccountDetail.findUnique({
      where: { userId }
    });
    
    if (!account) {
      throw new responseError(404, 'Akun WhatsApp tidak ditemukan');
    }
    
    return account;
  }

  /**
   * Mendapatkan daftar semua user (untuk admin)
   * @param {number} page - Halaman
   * @param {number} limit - Jumlah data per halaman
   * @returns {Promise<Object>} Daftar user dan pagination
   */
  static async getAllUsers(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where : {role : "USER"},
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          phoneNumber: true,
          address: true,
          businessName: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.user.count()
    ]);
    
    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Menghapus user (untuk admin)
   * @param {string} userId - ID user yang akan dihapus
   * @returns {Promise<Object>} User yang dihapus
   */
  static async deleteUser(userId) {
    await this.getUserById(userId)
    const deletedUser = await prisma.user.delete({
      where: { id: userId }
      });
      
      const { password, ...userWithoutPassword } = deletedUser;
      return userWithoutPassword;
  }
} 