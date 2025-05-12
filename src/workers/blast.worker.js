import { blastQueue, templateSyncQueue } from '../config/queue.js';
import { BlastService } from '../services/blast.service.js';
import { TemplateService } from '../services/template.service.js';
import prisma from '../config/database.js';

/**
 * Worker untuk memproses queue blast WhatsApp
 * 
 * Cara kerja:
 * 1. Memproses job dari queue 'whatsapp-blast'
 * 2. Mengambil data blast dari database
 * 3. Mengirim blast jika statusnya SCHEDULED
 * 4. Mencatat hasil pengiriman
 */

// Processor untuk blast WhatsApp
blastQueue.process(async (job, done) => {
  const { blastId } = job.data;
  
  try {
    console.log(`🔄 Memproses blast: ${blastId}`);
    
    // Ambil data blast
    const blast = await prisma.waBlast.findUnique({
      where: { id: blastId }
    });
    
    if (!blast) {
      throw new Error(`Blast dengan ID ${blastId} tidak ditemukan`);
    }
    
    // Cek status blast
    if (blast.status !== 'SCHEDULED') {
      throw new Error(`Blast tidak dalam status SCHEDULED (status: ${blast.status})`);
    }
    
    // Kirim blast
    const result = await BlastService.sendBlast(blastId);
    
    // Selesai
    done(null, result);
    
  } catch (error) {
    console.error(`Error memproses blast ${blastId}:`, error);
    
    // Update status blast jadi FAILED jika terjadi error
    try {
      await prisma.waBlast.update({
        where: { id: blastId },
        data: { 
          status: 'FAILED',
          completedAt: new Date()
        }
      });
    } catch (updateError) {
      console.error(`Error mengupdate status blast ${blastId}:`, updateError);
    }
    
    // Kembalikan error ke queue
    done(error);
  }
});

// Processor untuk template sync
templateSyncQueue.process(async (job, done) => {
  const { templateId } = job.data;
  
  try {
    console.log(`🔄 Menyinkronkan template: ${templateId}`);
    
    // Ambil data template
    const template = await prisma.waTemplate.findUnique({
      where: { id: templateId }
    });
    
    if (!template) {
      throw new Error(`Template dengan ID ${templateId} tidak ditemukan`);
    }
    
    // Cek status template
    if (template.status !== 'SUBMITTED') {
      console.log(`Template tidak dalam status SUBMITTED (status: ${template.status}). Melanjutkan sync.`);
    }
    
    // Sync status template
    const result = await TemplateService.syncTemplateStatus(templateId);
    
    // Selesai
    done(null, result);
    
  } catch (error) {
    console.error(`Error menyinkronkan template ${templateId}:`, error);
    
    // Kembalikan error ke queue
    done(error);
  }
});

// Memulai consumer
const startWorkers = () => {
  console.log('🚀 Blast worker dimulai');
  
  // Setup template sync cron job (setiap 30 menit)
  templateSyncQueue.add(
    'sync-all-submitted-templates',
    {},
    {
      jobId: 'template-sync-cron',
      repeat: {
        cron: '*/30 * * * *' // setiap 30 menit
      }
    }
  );
  
  // Handle sync-all job
  templateSyncQueue.process('sync-all-submitted-templates', async (job, done) => {
    try {
      // Ambil semua template dengan status SUBMITTED
      const submittedTemplates = await prisma.waTemplate.findMany({
        where: { status: 'SUBMITTED' }
      });
      
      console.log(`🔍 Sinkronisasi otomatis: Menemukan ${submittedTemplates.length} template untuk diupdate`);
      
      // Sync satu per satu
      for (const template of submittedTemplates) {
        await templateSyncQueue.add({ templateId: template.id });
      }
      
      done(null, { processed: submittedTemplates.length });
      
    } catch (error) {
      console.error('Error dalam scheduled sync templates:', error);
      done(error);
    }
  });
  
  // Cari blast yang terjadwal dan sudah lewat waktunya
  const processMissedBlasts = async () => {
    try {
      // Ambil semua blast dengan status SCHEDULED dan waktunya sudah lewat
      const missedBlasts = await prisma.waBlast.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: {
            lt: new Date()
          }
        }
      });
      
      console.log(`🔍 Ditemukan ${missedBlasts.length} blast terjadwal yang terlewat`);
      
      // Buat job untuk setiap blast yang terlewat
      for (const blast of missedBlasts) {
        await blastQueue.add({ blastId: blast.id });
      }
      
    } catch (error) {
      console.error('Error mencari blast terlewat:', error);
    }
  };
  
  // Jalankan sekali saat startup
  processMissedBlasts();
};

// Auto-start worker jika file dijalankan langsung
if (import.meta.url === `file://${process.argv[1]}`) {
  startWorkers();
}

// Export untuk digunakan di file lain
export default startWorkers; 