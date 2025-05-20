import { z } from 'zod';

// Skema untuk button template
const buttonComponentSchema = z.object({
  type: z.literal('BUTTONS'),
  buttons: z.array(
    z.object({
      type: z.enum(['URL', 'PHONE_NUMBER', 'QUICK_REPLY']),
      text: z.string().min(1, { message: 'Teks tombol tidak boleh kosong' }).max(25, { message: 'Teks tombol maksimal 25 karakter' }),
      url: z.string().url({ message: 'URL harus valid' }).optional(),
      phone_number: z.string().regex(/^[0-9+]+$/, { message: 'Nomor telepon harus berupa angka' }).optional(),
    })
  ).min(1, { message: 'Minimal harus ada 1 tombol' }).max(3, { message: 'Maksimal 3 tombol' }),
});

// Skema untuk header template
const headerComponentSchema = z.object({
  type: z.literal('HEADER'),
  format: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT']),
  text: z.string().max(60, { message: 'Teks header maksimal 60 karakter' }).optional(),
  example: z.object({
    header_url: z.array(z.string().url({ message: 'URL harus valid' })).optional(),
  }).optional(),
});

// Skema untuk body template
const bodyComponentSchema = z.object({
  type: z.literal('BODY'),
  text: z.string().min(1, { message: 'Teks body tidak boleh kosong' }).max(1024, { message: 'Teks body maksimal 1024 karakter' }),
  example: z.object({
    body_text: z.array(z.array(z.string())).optional(),
  }).optional(),
});

// Skema untuk footer template
const footerComponentSchema = z.object({
  type: z.literal('FOOTER'),
  text: z.string().max(60, { message: 'Teks footer maksimal 60 karakter' }),
});

// Skema untuk membuat template baru
export const createOrUpdateTemplateSchema = z.object({
  name: z.string({
    required_error: 'Nama template wajib diisi',
  })
    .min(1, { message: 'Nama template tidak boleh kosong' })
    .regex(/^[a-z_]+$/, { message: 'Nama hanya boleh mengandung huruf kecil dan garis bawah' }),
  language: z.string({
    required_error: 'Bahasa wajib diisi',
  }).min(2, { message: 'Kode bahasa minimal 2 karakter' }).max(5, { message: 'Kode bahasa maksimal 5 karakter' }),
  category: z.enum(['MARKETING', 'UTILITY', 'AUTHENTICATION', 'ALERT_UPDATE'], {
    required_error: 'Kategori wajib diisi',
    invalid_type_error: 'Kategori tidak valid',
  }),
  components: z.array(
    z.discriminatedUnion('type', [
      headerComponentSchema,
      bodyComponentSchema,
      footerComponentSchema,
      buttonComponentSchema,
    ])
  ).min(1, { message: 'Minimal harus ada 1 komponen' }),
});

// Skema untuk membuat Blast WhatsApp
export const createBlastSchema = z.object({
  name: z.string({
    required_error: 'Nama blast wajib diisi',
  })
    .min(1, { message: 'Nama blast tidak boleh kosong' })
    .regex(/^[a-z_]+$/, { message: 'Nama hanya boleh mengandung huruf kecil dan garis bawah' }),
  templateId: z.string({
    required_error: 'ID template wajib diisi',
  }),
  recipients: z.array(
    z.string().regex(/^62[0-9]{8,13}$/, { 
      message: 'Nomor telepon harus diawali dengan 62 (tanpa + atau 0) dan diikuti 8-11 digit angka'
    })
  ).min(1, { message: 'Minimal harus ada 1 penerima' }),
  // Opsi 1: Parameter global untuk semua penerima
  parameters: z.object({
    header: z.array(z.string()).optional(),
    body: z.array(z.string()).optional(),
    buttons: z.array(z.string()).optional(),
  }).optional(),
  // Opsi 2: Parameter spesifik per nomor telepon
  recipientParameters: z.record(
    z.object({
      header: z.array(z.string()).optional(),
      body: z.array(z.string()).optional(),
      buttons: z.array(z.string()).optional(),
    })
  ).optional(),
  scheduledAt: z.string().datetime({ offset: true, message: 'Format tanggal tidak valid' }).optional(),
});

// Skema untuk mengubah Blast WhatsApp
export const updateBlastSchema = createBlastSchema.partial(); 