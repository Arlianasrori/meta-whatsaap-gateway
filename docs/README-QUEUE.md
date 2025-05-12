# Sistem Queue untuk Blast WhatsApp

Aplikasi ini menggunakan Bull dan Redis untuk mengelola pengiriman blast WhatsApp terjadwal secara asinkron dan handal.

## Cara Kerja

1. **Penjadwalan Blast:**
   - Ketika user membuat atau mengupdate blast dengan waktu pengiriman terjadwal
   - Job ditambahkan ke queue dengan delay yang dihitung dari waktu sekarang hingga waktu pengiriman
   - Status blast di database diubah menjadi `SCHEDULED`

2. **Eksekusi Blast:**
   - Ketika waktu pengiriman tiba, worker memproses job dari queue
   - Worker mengambil data blast dari database dan mulai proses pengiriman
   - Status blast diubah menjadi `PROCESSING` selama pengiriman
   - Setelah pengiriman selesai, status diubah menjadi `COMPLETED` atau `FAILED`

3. **Sinkronisasi Template:**
   - Sistem juga memiliki queue untuk menyinkronkan status template secara berkala
   - Setiap 30 menit, worker akan mengecek status template yang masih `SUBMITTED`
   - Template yang sudah disetujui oleh Meta akan diupdate statusnya menjadi `APPROVED`

## Konfigurasi

Konfigurasi Redis bisa diubah melalui environment variables:

```
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_DB=0
```

## Menjalankan Aplikasi

Ada beberapa cara menjalankan aplikasi dengan sistem queue:

### 1. Semua Dalam Satu Proses

```bash
npm run start  # atau npm run dev untuk development
```

Server API dan worker akan berjalan dalam satu proses.

### 2. API dan Worker Terpisah (Direkomendasikan untuk Production)

```bash
# Terminal 1: Hanya API
npm run dev:api

# Terminal 2: Hanya Worker
npm run dev:worker
```

Menjalankan API dan worker di proses terpisah untuk performa dan stabilitas lebih baik.

## Prasyarat

- Redis server harus sudah terinstal dan berjalan
- Node.js versi 14 atau lebih tinggi

## Menjalankan Redis di Docker

```bash
docker run --name redis -p 6379:6379 -d redis:alpine
```

## Monitoring Queue

Untuk monitoring queue, Anda bisa menggunakan [Bull Board](https://github.com/felixmosh/bull-board) dengan menambahkan kode berikut:

```javascript
// src/app.js (menambahkan middleware untuk Bull Board)
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { blastQueue, templateSyncQueue } from './config/queue.js';

// ... kode lainnya ...

// Setup Bull Board
const serverAdapter = new ExpressAdapter();
const bullBoard = createBullBoard({
  queues: [
    new BullAdapter(blastQueue),
    new BullAdapter(templateSyncQueue)
  ],
  serverAdapter
});
serverAdapter.setBasePath('/admin/queues');
app.use('/admin/queues', authenticate, authorizeAdmin, serverAdapter.getRouter());
```

## Troubleshooting

1. **Redis Connection Failed**
   - Pastikan Redis server berjalan
   - Cek konfigurasi host, port, dan password

2. **Job Tidak Diproses**
   - Pastikan worker berjalan 
   - Cek error logs pada worker

3. **Missed Schedules**
   - Sistem secara otomatis mencari blast terjadwal yang terlewat saat startup
   - Blast terlewat akan segera diproses 