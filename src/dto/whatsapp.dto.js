import { z } from 'zod';

/**
 * DTO untuk validasi request register WhatsApp number
 */
export const registerNumberSchema = z.object({
  displayName: z.string({required_error : "displayName is required"})
    .min(3, { message: 'Nama display minimal 3 karakter' })
    .max(100, { message: 'Nama display maksimal 100 karakter' }),
  
  phoneNumber: z.string({required_error : "phoneNumber is required"}).regex(/^62[0-9]{8,13}$/, { 
    message: "Nomor telepon harus diawali dengan 62 (tanpa + atau 0) dan diikuti 8-11 digit angka" 
  })
});

/**
 * DTO untuk validasi request OTP
 */
export const requestOtpSchema = z.object({
  method: z.enum(['SMS', 'VOICE'],{required_error : "method is required"}).default('SMS'),
  language: z.string({required_error : "language is required"}).length(2, { 
    message: 'Language harus 2 karakter (contoh: id)' 
  }).default('id')
});

/**
 * DTO untuk validasi verifikasi OTP
 */
export const verifyOtpSchema = z.object({
  code: z.number({required_error : "code is required", message : "code should be a number"})
});

/**
 * DTO untuk validasi pengiriman pesan 
 */
export const sendTextMessageSchema = z.object({
  to: z.string({required_error : "Phone Number to user is required (to)"}).regex(/^[0-9]{8,13}$/, { 
    message: "Nomor telepon harus diawali dengan 62 (tanpa + atau 0) dan diikuti 8-11 digit angka" 
  }),
  
  message: z.string({required_error : "message is required"}).min(1, { message: 'Pesan minimal 1 karakter' })
    .min(1, { message: 'Pesan minimal 1 karakter' })
    .max(4096, { message: 'Pesan maksimal 4096 karakter' })
});

export const sendButtonMessageSchema = z.object({
  to: z.string({required_error : "Phone Number to user is required (to)"}).regex(/^[0-9]{8,13}$/, { 
    message: "Nomor telepon harus diawali dengan 62 (tanpa + atau 0) dan diikuti 8-11 digit angka" 
  }),
  text: z.string({required_error : "text is required"}).min(1),
  buttons: z.array(z.object({
    type: z.literal("reply"),
    title: z.string({required_error : "title is required"}).min(1).max(20),
    id: z.string({required_error : "id is required"}).min(1)
  })).min(1).max(3)
});

export const sendListMessageSchema = z.object({
  to: z.string({required_error : "Phone Number to user is required (to)"}).regex(/^[0-9]{8,13}$/, { 
    message: "Nomor telepon harus diawali dengan 62 (tanpa + atau 0) dan diikuti 8-11 digit angka" 
  }),
  header: z.string({required_error : "header is required"}).min(1),
  body: z.string({required_error : "body is required"}).min(1),
  buttonText: z.string({required_error : "buttonText is required"}).min(1),
  sections: z.array(z.object({
    title: z.string({required_error : "title is required"}).min(1),
    rows: z.array(z.object({
      id: z.string({required_error : "id is required"}).min(1),
      title: z.string({required_error : "title is required"}).min(1),
      description: z.string().optional()
    })).min(1)
  })).min(1)
});

export const sendImageMessageSchema = z.object({
  to: z.string({required_error : "Phone Number to user is required (to)"}).regex(/^[0-9]{8,13}$/, { 
    message: "Nomor telepon harus diawali dengan 62 (tanpa + atau 0) dan diikuti 8-11 digit angka" 
  }),
  image_caption : z.string({required_error : "image_caption is required"}).min(1)
});

export const sendDocumentMessageSchema = z.object({
  to: z.string({required_error : "Phone Number to user is required (to)"}).regex(/^[0-9]{8,13}$/, { 
    message: "Nomor telepon harus diawali dengan 62 (tanpa + atau 0) dan diikuti 8-11 digit angka" 
  }),
  file_name : z.string({required_error : "file_name is required"}).min(1)
});


export const sendLocationMessageSchema = z.object({
  to: z.string().regex(/^62[0-9]{8,13}$/),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    name: z.string().optional(),
    address: z.string().optional()
  })
});

