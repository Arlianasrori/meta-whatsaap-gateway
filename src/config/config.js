import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  jwt: {
    secret: process.env.JWT_SECRET || 'rahasia-jwt-default',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'rahasia-refresh-default',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 jam untuk access token
    },
    refreshCookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 hari untuk refresh token
    }
  },
  whatsapp: {
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v19.0',
    baseUrl: 'https://graph.facebook.com',
    webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN || 'token-verifikasi-default',
    wabaId: process.env.WABA_ID || '123456789012345',
    accessToken: process.env.META_ACCESS_TOKEN || 'token-meta-default'
  },
  environment: process.env.NODE_ENV || 'development'
}; 