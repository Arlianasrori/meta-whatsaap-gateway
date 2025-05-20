import { PrismaClient } from '@prisma/client';
import snap from '../config/midtrans.js';

const prisma = new PrismaClient();

/**
 * Layanan untuk manajemen paket WhatsApp
 */
class PackageService {
  /**
   * Mendapatkan daftar semua jenis paket yang aktif
   */
  async getAllPackageTypes() {
    try {
      return await prisma.packageType.findMany({
        where: { isActive: true },
        orderBy: { price: 'asc' }
      });
    } catch (error) {
      console.error('Error getting package types:', error);
      throw new Error('Gagal mendapatkan daftar paket');
    }
  }

  /**
   * Mendapatkan paket aktif milik user
   */
  async getUserActivePackage(userId) {
    try {
      const now = new Date();
      return await prisma.userPackage.findFirst({
        where: {
          userId,
          isActive: true,
          endDate: { gt: now }
        },
        include: {
          packageType: true
        }
      });
    } catch (error) {
      console.error('Error getting user active package:', error);
      throw new Error('Gagal mendapatkan paket aktif');
    }
  }

  /**
   * Memeriksa apakah user memiliki kuota pesan yang cukup
   */
  async checkUserMessageQuota(userId) {
    try {
      const activePackage = await this.getUserActivePackage(userId);
      
      if (!activePackage) {
        return {
          hasQuota: false,
          message: 'Anda tidak memiliki paket aktif'
        };
      }
      
      const remainingQuota = activePackage.messageQuota - activePackage.messageUsed;
      
      return {
        hasQuota: remainingQuota > 0,
        remainingQuota,
        packageId: activePackage.id,
      };
    } catch (error) {
      console.error('Error checking message quota:', error);
      throw new Error('Gagal memeriksa kuota pesan');
    }
  }

  /**
   * Mencatat penggunaan kuota pesan
   */
  async recordMessageUsage(userId, count = 1) {
    try {
      const quotaCheck = await this.checkUserMessageQuota(userId);
      
      if (!quotaCheck.hasQuota) {
        throw new Error(quotaCheck.message);
      }
      
      // Update jumlah pesan yang digunakan
      await prisma.userPackage.update({
        where: { id: quotaCheck.packageId },
        data: { messageUsed: { increment: count } }
      });
      
      return true;
    } catch (error) {
      console.error('Error recording message usage:', error);
      throw new Error('Gagal mencatat penggunaan pesan');
    }
  }

  /**
   * Membuat transaksi untuk pembelian paket
   */
  async createPackageTransaction(userId, packageTypeId) {
    try {
      // Get package info
      const packageType = await prisma.packageType.findUnique({
        where: { id: packageTypeId }
      });
      
      if (!packageType || !packageType.isActive) {
        throw new Error('Paket tidak tersedia');
      }
      
      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        throw new Error('User tidak ditemukan');
      }
      
      // Create transaction record
      const transaction = await prisma.transaction.create({
        data: {
          userId,
          amount: packageType.price,
          status: 'PENDING',
          packageTypeId: packageType.id,
          expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 jam
        }
      });
      
      // Create Midtrans transaction
      const parameter = {
        transaction_details: {
          order_id: transaction.id,
          gross_amount: packageType.price
        },
        customer_details: {
          first_name: user.name,
          phone: user.phoneNumber,
        },
        item_details: [{
          id: packageType.id,
          name: packageType.name,
          price: packageType.price,
          quantity: 1
        }],
        callbacks: {
          finish: process.env.MIDTRANS_CALLBACK_URL + '/finish',
        }
      };
      
      // Get Midtrans Snap token
      const midtransResponse = await snap.createTransaction(parameter);
      
      // Update transaction with Midtrans token
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          midtransOrderId: transaction.id,
          midtransToken: midtransResponse.token
        }
      });
      
      return {
        transactionId: transaction.id,
        paymentToken: midtransResponse.token,
        redirectUrl: midtransResponse.redirect_url
      };
    } catch (error) {
      console.error('Error creating package transaction:', error);
      throw new Error('Gagal membuat transaksi: ' + error.message);
    }
  }

  /**
   * Memproses callback pembayaran dari Midtrans
   */
  async processPaymentCallback(notification) {
    try {
      // Validasi callback dari Midtrans
      const transactionStatus = notification.transaction_status;
      const orderId = notification.order_id;
      const paymentType = notification.payment_type;
      
      // Cari transaksi berdasarkan order ID
      const transaction = await prisma.transaction.findUnique({
        where: { id: orderId }
      });
      
      if (!transaction) {
        throw new Error('Transaksi tidak ditemukan');
      }
      
      // Update status transaksi berdasarkan status Midtrans
      let status;
      let updateData = {};
      
      if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
        status = 'PAID';
        updateData.paidAt = new Date();
      } else if (transactionStatus === 'cancel' || transactionStatus === 'deny') {
        status = 'CANCELED';
        updateData.canceledAt = new Date();
      } else if (transactionStatus === 'expire') {
        status = 'EXPIRED';
      } else if (transactionStatus === 'pending') {
        status = 'PENDING';
      } else {
        status = 'FAILED';
      }
      
      // Update transaksi
      await prisma.transaction.update({
        where: { id: orderId },
        data: {
          status,
          paymentMethod: paymentType,
          ...updateData
        }
      });
      
      // Jika pembayaran berhasil, aktivasi paket
      if (status === 'PAID') {
        await this.activateUserPackage(transaction.userId, orderId);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error processing payment callback:', error);
      throw new Error('Gagal memproses callback pembayaran');
    }
  }

  /**
   * Aktivasi paket setelah pembayaran berhasil
   */
  async activateUserPackage(userId, transactionId) {
    try {
      // Get transaction data
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId }
      });
      
      if (!transaction || transaction.status !== 'PAID') {
        throw new Error('Transaksi tidak valid');
      }
      
      const packageType = await prisma.packageType.findFirst({
        where: { 
          id: transaction.packageTypeId
        }
      });
      
      if (!packageType) {
        throw new Error('Paket tidak ditemukan');
      }
      
      // Hitung tanggal akhir paket
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + packageType.validityDays);
      
      // Buat user package baru
      const userPackage = await prisma.userPackage.create({
        data: {
          userId,
          packageTypeId: packageType.id,
          messageQuota: packageType.messageQuota,
          messageUsed: 0,
          startDate,
          endDate,
          isActive: true
        }
      });
      
      // Update transaksi dengan ID paket user
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { userPackageId: userPackage.id }
      });
      
      // Deaktifkan paket aktif lama jika ada
      await prisma.userPackage.updateMany({
        where: {
          userId,
          isActive: true,
          id: { not: userPackage.id }
        },
        data: { isActive: false }
      });
      
      return userPackage;
    } catch (error) {
      console.error('Error activating user package:', error);
      throw new Error('Gagal mengaktifkan paket');
    }
  }
}

export default new PackageService(); 