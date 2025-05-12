# 🚀 GVINUM WhatsApp Gateway

<div align="center">
  <img src="https://img.shields.io/badge/Meta-Official%20API-blue?style=for-the-badge&logo=meta"/>
  <img src="https://img.shields.io/badge/WhatsApp-Business%20API-25D366?style=for-the-badge&logo=whatsapp"/>
  <img src="https://img.shields.io/badge/Redis-Queue-DC382D?style=for-the-badge&logo=redis"/>
  <img src="https://img.shields.io/badge/Bull-Queue-FF0000?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Node.js-Server-339933?style=for-the-badge&logo=node.js"/>
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma"/>
</div>

---

## 📱 Ringkasan Proyek

**GVINUM WhatsApp Gateway** adalah sistem pengelolaan WhatsApp Business API (WABA) yang komprehensif. Dirancang untuk menangani banyak nomor WhatsApp (multi-WABA), dengan fitur chatbot otomatis dan sistem broadcast pesan massal.

### ✨ Fitur Utama

- 🔄 **PhoneNumber Integration**: Daftar nomor anda dalam waba kami untuk mengirim pesan
- 🤖 **ChatFlow System**: Buat alur percakapan otomatis dengan node visual
- 📩 **Blast System**: Kirim pesan template ke banyak penerima sekaligus
- 📝 **Template Management**: Kelola template pesan yang perlu disetujui Meta
- 📊 **Reporting & Analytics**: Pantau kinerja pengiriman pesan dan interaksi
- 🔐 **Multi-User Access**: Berbagai level akses user dengan kemampuan berbeda

## 🔍 Fitur Detail

### 🤖 ChatFlow (Alur Percakapan Otomatis)

ChatFlow memungkinkan Anda membuat percakapan otomatis interaktif:

- 📊 **Visual Node Editor**: Rancang alur percakapan dengan node visual
- 🔀 **Flow Logic**: Tetapkan jalur percakapan berdasarkan input pengguna
- 🎛️ **Multi-Format**: Dukungan teks, tombol, dan pesan interaktif
- 🔄 **State Management**: Sistem state management untuk mengontrol alur
- 🔌 **Integrasi API**: Hubungkan dengan API eksternal untuk respons dinamis

#### Contoh Struktur ChatFlow:

```json
{
  "root": {
    "type": "text",
    "state": "root",
    "content": "Selamat datang! Pilih layanan:\n1. Produk\n2. Bantuan",
    "options": {
      "1": "produk",
      "2": "bantuan"
    }
  },
  "produk": {
    "type": "interactive",
    "state": "produk",
    "content": {
      "type": "list",
      "body": "Berikut adalah produk kami:",
      "button": "Lihat Produk",
      "sections": [...]
    }
  }
}
```

### 📩 Blast System (WhatsApp Broadcast)

Kirim pesan ke banyak kontak sekaligus secara efisien:

- 📝 **Template Management**: Buat template yang sesuai dengan kebijakan Meta
- 📅 **Scheduled Sending**: Jadwalkan waktu pengiriman pesan 
- 🧮 **Parameter Handling**: Personalisasi pesan dengan parameter dinamis
- 📊 **Delivery Tracking**: Pantau status pengiriman pesan
- 📈 **Queue Management**: Pengelolaan antrian untuk pengiriman efisien

#### Contoh Template WhatsApp:

```json
{
  "name": "informasi_pesanan",
  "language": "id",
  "category": "UTILITY",
  "components": [
    {
      "type": "HEADER",
      "format": "TEXT",
      "text": "Pesanan #{{1}}"
    },
    {
      "type": "BODY",
      "text": "Halo {{2}}, pesanan Anda:\nProduk: {{3}}\nTotal: Rp{{4}}"
    },
    {
      "type": "FOOTER",
      "text": "Terima kasih telah berbelanja"
    },
    {
      "type": "BUTTONS",
      "buttons": [...]
    }
  ]
}
```

## 🛠️ Teknologi

### Core Technologies

- ⚡ **WhatsApp Business API**: Integrasi resmi dengan Meta Cloud API
- 🔄 **Bull & Redis**: Sistem antrian untuk mengelola pengiriman pesan massal
- 🗃️ **Prisma**: ORM untuk manajemen database 
- 🔧 **Express.js**: REST API framework
- 🔒 **JWT**: Autentikasi berbasis token
- 📜 **Swagger**: Dokumentasi API

### Queue System

Sistem queue berbasis Bull dan Redis menangani:

- ⏱️ **Scheduled Broadcasts**: Pesan terjadwal diantrikan untuk pengiriman nanti
- 🔄 **Template Sync**: Sinkronisasi status template dengan Meta secara berkala
- 📊 **Retry Mechanism**: Mekanisme retry otomatis untuk pengiriman yang gagal
- 📈 **Performance Throttling**: Pembatasan laju pengiriman untuk performa optimal

## 🚀 Cara Kerja

### Multi-WABA Management

1. **Pendaftaran Nomor**: Daftarkan nomor ke WABA melalui API
2. **Verifikasi OTP**: Verifikasi nomor dengan kode OTP dari Meta
3. **Management**: Kelola banyak nomor dalam satu dashboard

### Flow ChatBot

1. **Pembuatan Flow**: Buat alur percakapan dengan node generator
2. **Aktivasi Flow**: Aktifkan flow untuk nomor WhatsApp tertentu
3. **Interaksi User**: Sistem merespon otomatis sesuai alur yang ditentukan
4. **State Tracking**: Sistem melacak state percakapan setiap user

### WhatsApp Blast

1. **Template Creation**: Buat dan ajukan template untuk persetujuan Meta
2. **Recipient Selection**: Pilih penerima dan tentukan parameter pesan
3. **Scheduling**: Jadwalkan waktu pengiriman (opsional)
4. **Queue Processing**: Sistem antrean memproses pengiriman secara optimal
5. **Status Tracking**: Pantau status pengiriman setiap pesan

## 🔧 Instalasi & Penggunaan

### Prasyarat

- Node.js v14+ 
- Redis server
- Database (MySQL/PostgreSQL)

### Langkah Instalasi

```bash
# Clone repositori
git clone https://github.com/username/gvinum-whatsaap-gateway.git
cd gvinum-whatsaap-gateway

# Instalasi dependensi
npm install

# Setup database
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate

# Jalankan seed (opsional)
npm run prisma:seed
```

### Mode Pengoperasian

```bash
# Mode all-in-one (API + worker)
npm run start

# Mode terpisah (direkomendasikan untuk production)
npm run dev:api    # Terminal 1: API server
npm run dev:worker # Terminal 2: Queue worker
```

### Konfigurasi

Buat file `.env` dengan konfigurasi berikut:

```
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/waba_gateway"

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_DB=0

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Meta
META_API_VERSION=v16.0
```

## 🌐 API Endpoints

### Multi-WABA Management

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/whatsapp/register` | POST | Daftarkan nomor ke WABA |
| `/api/whatsapp/request-verification` | POST | Minta kode OTP verifikasi |
| `/api/whatsapp/verify` | POST | Verifikasi nomor dengan kode OTP |

### Template Management

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/templates` | POST | Buat template baru |
| `/templates/:templateId` | GET | Dapatkan detail template |
| `/templates` | GET | Dapatkan semua template |
| `/templates/:templateId/submit` | POST | Ajukan template ke Meta |

### Blast Management

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/blast` | POST | Buat blast baru |
| `/blast/:blastId` | GET | Dapatkan detail blast |
| `/blast/:blastId/send` | POST | Kirim blast |
| `/blast/:blastId/cancel` | POST | Batalkan blast terjadwal |

### ChatFlow Management

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/flows` | POST | Buat flow baru |
| `/flows` | GET | Dapatkan semua flow |
| `/flows/:flowId` | GET | Dapatkan detail flow |
| `/flows/:flowId/activate` | PUT | Aktifkan flow |

### Endpoint lainnya

## 📊 Dashboard & Analytics

System menyediakan dashboard untuk:

- 📈 **Message Analytics**: Statistik pengiriman dan pembacaan pesan
- 🔍 **User Engagement**: Analisis interaksi pengguna dengan chatbot
- 📅 **Template Status**: Pantau status persetujuan template
- 🎯 **Conversion Tracking**: Lacak konversi dari interaksi chatbot


## 📜 Lisensi

Dilindungi hak cipta © 2024 Habil Arlian Asrori 