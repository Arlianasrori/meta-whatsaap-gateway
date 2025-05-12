import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';

/**
 * Menghasilkan hash password
 * @param {string} password - Password yang akan dihash
 * @returns {Promise<string>} Password yang sudah dihash
 */
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Membandingkan password dengan hash yang tersimpan
 * @param {string} password - Password yang akan diverifikasi
 * @param {string} hashedPassword - Password hash yang tersimpan
 * @returns {Promise<boolean>} Hasil perbandingan
 */
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Membuat access token JWT
 * @param {Object} payload - Data yang akan disimpan dalam token
 * @returns {string} Access Token JWT
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

/**
 * Membuat refresh token JWT dengan waktu yang lebih lama
 * @param {Object} payload - Data yang akan disimpan dalam token
 * @returns {string} Refresh Token JWT
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.refreshSecret || config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn || '7d' // Default 7 hari
  });
};

/**
 * Verifikasi token JWT
 * @param {string} token - Token yang akan diverifikasi
 * @param {string} secret - Secret untuk verifikasi token
 * @returns {Object} Payload yang didecode
 */
export const verifyToken = (token, secret = config.jwt.secret) => {
  return jwt.verify(token, secret);
};