import startBlastWorkers from './blast.worker.js';

console.log('🚀 Memulai workers untuk WhatsApp Gateway...');

// Mulai workers blast WhatsApp
startBlastWorkers();

// Tangani exit signals
process.on('SIGINT', async () => {
  console.log('👋 Menutup workers...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('👋 Menutup workers...');
  process.exit(0);
});

// Tangani uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
}); 