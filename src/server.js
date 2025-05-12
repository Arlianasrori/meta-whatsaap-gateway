import app from './app.js';
import { config } from './config/config.js';
import prisma from './config/database.js';
import startWorkers from './workers/blast.worker.js';

// Port
const PORT = config.port;

// Connect to database and start server
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('🔌 Terhubung ke database');
    
    // Start workers
    if (process.env.START_WORKERS !== 'false') {
      console.log('🔄 Memulai background workers');
      // startWorkers();
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server berjalan di port ${PORT}`);
      console.log(`🌐 Mode: ${config.environment}`);
    });
  } catch (error) {
    console.error('❌ Gagal menghubungkan ke database:', error);
    process.exit(1);
  } finally {
    // Disconnect gracefully on process termination
    process.on('SIGINT', async () => {
      await prisma.$disconnect();
      console.log('👋 Terputus dari database');
      process.exit(0);
    });
  }
}

startServer(); 