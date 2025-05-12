import { config } from '../config/config.js';
import { verifyToken, generateToken, generateRefreshToken } from '../utils/auth.js';
import prisma  from '../config/database.js';

/**
 * Middleware untuk autentikasi user berdasarkan token JWT
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const authenticate = async (req, res, next) => {
  try {
    // Coba ambil token dari cookie
    let token = req.cookies?.access_token;
    
    // Jika tidak ada, periksa header authorization
    if (!token) {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          status: 'error',
          message: 'Token tidak tersedia'
        });
      }
      
      // Ambil token dari header
      token = authHeader.split(' ')[1];
      
      if (!token) {
          return res.status(401).json({
            status: 'error',
            message: 'Token tidak tersedia'
          });
      }
    }
    
    // Verifikasi token
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id
      }
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User tidak ditemukan'
      });
    }
    // Simpan informasi user di object request
    req.user = user;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token tidak valid'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token sudah kedaluwarsa'
      });
    }
  }
};

/**
 * Middleware untuk otorisasi admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const authorizeAdmin = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({
        status: 'error',
        message: 'Hanya admin yang dapat mengakses resource ini'
      });
    }
    next();
  } catch (error) {
    return res.status(403).json({
      status: 'error',
      message: 'Hanya admin yang dapat mengakses resource ini'
    });
  }
};

/**
 * Handler untuk refresh token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const refreshAccessToken = (req, res, next) => {
  try {
    // Ambil refresh token dari cookie
    const refreshToken = req.cookies?.refresh_token;
    
    if (!refreshToken) {
      return res.status(401).json({
        status: 'error',
        message: 'Refresh token tidak tersedia'
      });
    }
    
    // Verifikasi refresh token
    const decoded = verifyToken(refreshToken, config.jwt.refreshSecret || config.jwt.secret);
    
    // Generate access token baru
    const newAccessToken = generateToken({
      id: decoded.id,
      role: decoded.role
    });

    const newRefreshToken = generateRefreshToken({
      id: decoded.id,
      role: decoded.role
    });
    
    // Set cookie baru
    res.cookie('access_token', newAccessToken, config.jwt.cookie);
    res.cookie('refresh_token', newRefreshToken, config.jwt.refreshCookie);
    
    // Kembalikan token baru
    return res.status(200).json({
      status: 'success',
      message: 'Access token telah diperbarui',
      data: { accessToken: newAccessToken, refreshToken: newRefreshToken }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Refresh token tidak valid'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Refresh token sudah kedaluwarsa'
      });
    }
  }
}; 