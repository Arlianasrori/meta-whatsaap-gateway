import Bull from 'bull';
import { config } from './config.js';

// Konfigurasi Redis untuk Bull
const redisConfig = {
  redis: {
    port: process.env.REDIS_PORT || 6379,
    host: process.env.REDIS_HOST || '127.0.0.1',
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB || 0,
    // Opsi tambahan untuk mengatasi masalah koneksi
    enableReadyCheck: false,
    maxRetriesPerRequest: null
  },
  defaultJobOptions: {
    attempts: 3, // Jumlah percobaan jika gagal
    backoff: {
      type: 'exponential',
      delay: 5000, // Delay awal (5 detik)
    },
    removeOnComplete: true, // Hapus job dari queue setelah selesai
    removeOnFail: false, // Simpan job yang gagal untuk analisa
  },
};

// Queue untuk blast WhatsApp
export const blastQueue = new Bull('whatsapp-blast', redisConfig);

// Queue untuk menyinkronkan status template
export const templateSyncQueue = new Bull('template-sync', redisConfig);

// Nama queue yang tersedia untuk reference
export const QUEUES = {
  BLAST: 'whatsapp-blast',
  TEMPLATE_SYNC: 'template-sync',
};

// Helper untuk menambahkan job blast terjadwal
export const scheduleBlast = async (blastId, scheduledTime) => {
  const delay = new Date(scheduledTime).getTime() - Date.now();
  
  if (delay <= 0) {
    // Jika waktu sudah lewat, jadwalkan untuk dijalankan segera
    return await blastQueue.add({ blastId }, { delay: 1000 });
  }
  
  return await blastQueue.add(
    { blastId },
    { 
      delay,
      jobId: `blast:${blastId}`,
    }
  );
};

// Helper untuk membatalkan blast terjadwal
export const cancelScheduledBlast = async (blastId) => {
  const jobs = await blastQueue.getJobs(['delayed']);
  const job = jobs.find(job => job.data.blastId === blastId);
  
  if (job) {
    return await job.remove();
  }
  
  return false;
};

// Inisialisasi events untuk logging
blastQueue.on('completed', (job, result) => {
  console.log(`✅ Blast job ${job.id} completed. BlastId: ${job.data.blastId}`);
});

blastQueue.on('failed', (job, error) => {
  console.error(`❌ Blast job ${job.id} failed. BlastId: ${job.data.blastId}`, error);
});

templateSyncQueue.on('completed', (job, result) => {
  console.log(`✅ Template sync job ${job.id} completed. TemplateId: ${job.data.templateId}`);
});

templateSyncQueue.on('failed', (job, error) => {
  console.error(`❌ Template sync job ${job.id} failed. TemplateId: ${job.data.templateId}`, error);
}); 