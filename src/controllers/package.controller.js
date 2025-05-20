import packageService from '../services/package.service.js';

/**
 * Controller untuk manajemen paket WhatsApp
 */
class PackageController {
  /**
   * Mendapatkan daftar semua jenis paket
   */
  async getAllPackages(req, res) {
    try {
      const packages = await packageService.getAllPackageTypes();
      return res.status(200).json({
        success: true,
        data: packages
      });
    } catch (error) {
      console.error('Error getting packages:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Gagal mendapatkan daftar paket'
      });
    }
  }

  /**
   * Mendapatkan paket aktif dari user yang sedang login
   */
  async getActivePackage(req, res) {
    try {
      const userId = req.user.id;
      const activePackage = await packageService.getUserActivePackage(userId);
      
      if (!activePackage) {
        return res.status(200).json({
          success: true,
          data: null,
          message: 'Anda tidak memiliki paket aktif'
        });
      }
      
      const quotaInfo = await packageService.checkUserMessageQuota(userId);
      
      return res.status(200).json({
        success: true,
        data: {
          packageInfo: activePackage,
          quotaInfo: {
            used: activePackage.messageUsed,
            remaining: quotaInfo.remainingQuota,
            total: activePackage.messageQuota
          },
          validUntil: activePackage.endDate
        }
      });
    } catch (error) {
      console.error('Error getting active package:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Gagal mendapatkan paket aktif'
      });
    }
  }

  /**
   * Membuat transaksi pembelian paket
   */
  async purchasePackage(req, res) {
    try {
      const userId = req.user.id;
      const { packageTypeId } = req.body;
      
      if (!packageTypeId) {
        return res.status(400).json({
          success: false,
          message: 'ID paket tidak valid'
        });
      }
      
      const transactionData = await packageService.createPackageTransaction(userId, packageTypeId);
      
      return res.status(201).json({
        success: true,
        data: transactionData,
        message: 'Transaksi berhasil dibuat'
      });
    } catch (error) {
      console.error('Error purchasing package:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Gagal membuat transaksi'
      });
    }
  }

  /**
   * Mendapatkan riwayat transaksi user
   */
  async getTransactionHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;
      
      const skip = (page - 1) * limit;
      
      const transactions = await prisma.transaction.findMany({
        where: { userId },
        include: {
          userPackage: {
            include: {
              packageType: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      });
      
      const totalTransactions = await prisma.transaction.count({
        where: { userId }
      });
      
      return res.status(200).json({
        success: true,
        data: transactions,
        pagination: {
          total: totalTransactions,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(totalTransactions / limit)
        }
      });
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Gagal mendapatkan riwayat transaksi'
      });
    }
  }

  /**
   * Memproses callback pembayaran dari Midtrans
   */
  async handlePaymentCallback(req, res) {
    try {
      const notification = req.body;
      
      await packageService.processPaymentCallback(notification);
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error handling payment callback:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Gagal memproses callback pembayaran'
      });
    }
  }

  /**
   * Menangani setelah user redirect dari halaman pembayaran
   */
  async handlePaymentFinish(req, res) {
    try {
      const { transaction_id } = req.query;
      
      // Redirect ke halaman frontend yang sesuai
      // Di sini hanya mengembalikan status sebagai contoh
      return res.status(200).json({
        success: true,
        message: 'Pembayaran selesai',
        transactionId: transaction_id
      });
    } catch (error) {
      console.error('Error handling payment finish:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Gagal memproses hasil pembayaran'
      });
    }
  }
}

export default new PackageController(); 