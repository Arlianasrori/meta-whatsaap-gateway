import midtransClient from 'midtrans-client';
import dotenv from 'dotenv';

dotenv.config();

// Membuat instance Snap Midtrans
const snap = new midtransClient.Snap({
  isProduction: process.env.NODE_ENV === 'production',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

export default snap; 