# Panduan Implementasi Frontend WhatsApp Template dan Blast

## Pendahuluan

Dokumen ini memberikan panduan lengkap untuk mengembangkan frontend yang berintegrasi dengan sistem template dan blast WhatsApp. Panduan ini disesuaikan dengan API dan DTO yang sudah diimplementasikan di backend.

## 1. Struktur Template WhatsApp

Template WhatsApp terdiri dari beberapa komponen utama sesuai dengan format DTO yang digunakan:

### 1.1 Komponen Template

- **Header** (opsional): Bagian atas pesan, dapat berisi teks, gambar, video, atau dokumen
- **Body** (wajib): Isi utama pesan, berisi teks dengan parameter 
- **Footer** (opsional): Bagian bawah pesan, berisi teks pendek
- **Buttons** (opsional): Tombol interaktif, maksimal 3 buah

### 1.2 Format DTO Template

```typescript
// Format data untuk membuat/mengupdate template (sesuai createOrUpdateTemplateSchema)
interface TemplateData {
  name: string;           // Nama template (hanya huruf kecil dan garis bawah)
  language: string;       // Kode bahasa (id, en, dll)
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION' | 'ALERT_UPDATE';
  components: TemplateComponent[];
}

// Komponen template dengan discriminated union
type TemplateComponent = HeaderComponent | BodyComponent | FooterComponent | ButtonsComponent;

// Header component
interface HeaderComponent {
  type: 'HEADER';
  format: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  text?: string;          // Untuk format TEXT
  example?: {
    header_url?: string[];  // URL media untuk format non-TEXT
  };
}

// Body component
interface BodyComponent {
  type: 'BODY';
  text: string;
  example?: {
    body_text?: string[][];  // Contoh parameter untuk body
  };
}

// Footer component
interface FooterComponent {
  type: 'FOOTER';
  text: string;
}

// Buttons component
interface ButtonsComponent {
  type: 'BUTTONS';
  buttons: Button[];
}

// Tipe button
interface Button {
  type: 'URL' | 'PHONE_NUMBER' | 'QUICK_REPLY';
  text: string;
  url?: string;           // Untuk tipe URL
  phone_number?: string;  // Untuk tipe PHONE_NUMBER
}
```

### 1.3 Contoh JSON Template

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
      "text": "Halo {{2}}, pesanan Anda dengan rincian:\n\nProduk: {{3}}\nTotal: Rp{{4}}\n\nTelah kami terima dan sedang diproses.",
      "example": {
        "body_text": [["John Doe", "Sepatu Running", "150.000"]]
      }
    },
    {
      "type": "FOOTER",
      "text": "Terima kasih telah berbelanja"
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "URL",
          "text": "Lihat Detail",
          "url": "https://example.com/order/{{1}}"
        },
        {
          "type": "QUICK_REPLY",
          "text": "Hubungi CS"
        }
      ]
    }
  ]
}
```

## 2. Tipe Konten yang Didukung

### 2.1 Header

Header dapat berupa salah satu dari tipe berikut (sesuai dengan `headerComponentSchema`):

| Tipe | Deskripsi | Batasan | Parameter | Contoh Implementasi |
|------|-----------|---------|-----------|---------------------|
| TEXT | Teks biasa | Max 60 karakter | ✓ (maks 1) | `{{1}}` |
| IMAGE | Gambar JPG/PNG | Max 5MB | ✗ | URL gambar |
| VIDEO | Video MP4 | Max 16MB | ✗ | URL video |
| DOCUMENT | Dokumen | Max 100MB | ✗ | URL dokumen |

### 2.2 Body

Body hanya dapat berupa teks dengan parameter (sesuai dengan `bodyComponentSchema`):

- Maksimal 1024 karakter
- Dapat mengandung hingga 9 parameter `{{n}}`
- Mendukung format teks dasar (newline, spasi, dll)
- Memerlukan contoh nilai untuk setiap parameter (`example.body_text`)

### 2.3 Footer

Footer hanya berupa teks statis (sesuai dengan `footerComponentSchema`):

- Maksimal 60 karakter
- Tidak mendukung parameter

### 2.4 Buttons

WhatsApp mendukung 3 tipe tombol (sesuai dengan `buttonComponentSchema`):

| Tipe | Deskripsi | Parameter | Batasan |
|------|-----------|-----------|---------|
| URL | Tautan ke website | ✓ | Max 1 parameter di URL, teks max 25 karakter |
| PHONE_NUMBER | Nomor telepon | ✗ | Format nomor internasional, teks max 25 karakter |
| QUICK_REPLY | Tombol balas cepat | ✗ | Teks max 25 karakter |

## 3. Parameter Template

### 3.1 Format Parameter

Parameter dalam template menggunakan format `{{n}}`, di mana `n` adalah angka mulai dari 1.

### 3.2 Contoh Penggunaan Parameter

```
// Template Body
"Halo {{1}}, saldo Anda saat ini Rp{{2}}. Transaksi terakhir Anda pada {{3}}."

// Nilai Parameter
{
  "body": ["John", "500.000", "22 Maret 2024 14:30"]
}

// Hasil
"Halo John, saldo Anda saat ini Rp500.000. Transaksi terakhir Anda pada 22 Maret 2024 14:30."
```

### 3.3 Lokasi Parameter yang Didukung

| Komponen | Mendukung Parameter | Catatan |
|----------|---------------------|---------|
| Header (Text) | ✓ | Maks 1 parameter |
| Header (Media) | ✗ | Hanya URL statis |
| Body | ✓ | Maks 9 parameter |
| Footer | ✗ | Tidak mendukung parameter |
| Button URL | ✓ | Maks 1 parameter di URL |
| Button Lainnya | ✗ | Tidak mendukung parameter |

## 4. Struktur Blast

### 4.1 Format DTO Blast

```typescript
// Format data untuk membuat blast (sesuai createBlastSchema)
interface BlastData {
  name: string;                // Nama blast (hanya huruf kecil dan _)
  templateId: string;          // ID template yang akan digunakan
  recipients: string[];        // Array nomor tujuan (format: 62xxx)
  parameters?: {               // Parameter global untuk semua penerima
    header?: string[];
    body?: string[];
    buttons?: string[];
  };
  recipientParameters?: {      // Parameter spesifik per nomor
    [phoneNumber: string]: {
      header?: string[];
      body?: string[];
      buttons?: string[];
    }
  };
  scheduledAt?: string;        // Waktu pengiriman (ISO format dengan timezone)
}
```

### 4.2 Parameter Blast

Parameter blast harus sesuai dengan parameter yang dibutuhkan template. Ada dua cara menyediakan parameter sesuai dengan DTO:

1. **Parameter Global (`parameters`)**: Berlaku untuk semua penerima
2. **Parameter Spesifik (`recipientParameters`)**: Berbeda untuk setiap penerima berdasarkan nomor telepon

### 4.3 Contoh Blast dengan Parameter Global

```json
{
  "name": "notifikasi_saldo",
  "templateId": "template-id-123",
  "recipients": ["6281234567890", "6289876543210"],
  "parameters": {
    "body": ["10.000.000", "25 Maret 2024"]
  },
  "scheduledAt": "2024-03-28T15:00:00+07:00"
}
```

### 4.4 Contoh Blast dengan Parameter Spesifik

```json
{
  "name": "notifikasi_pembayaran",
  "templateId": "template-id-123",
  "recipients": ["6281234567890", "6289876543210"],
  "recipientParameters": {
    "6281234567890": {
      "header": ["INV-001"],
      "body": ["John Doe", "500.000", "28 Maret 2024"]
    },
    "6289876543210": {
      "header": ["INV-002"],
      "body": ["Jane Smith", "750.000", "28 Maret 2024"]
    }
  }
}
```

## 5. Implementasi Frontend

### 5.1 Endpoint API

#### 5.1.1 Template Endpoints

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/templates` | POST | Membuat template baru |
| `/templates/:templateId` | GET | Mendapatkan detail template |
| `/templates` | GET | Mendapatkan semua template (query: status) |
| `/templates/:templateId` | PUT | Mengupdate template |
| `/templates/:templateId` | DELETE | Menghapus template |
| `/templates/:templateId/submit` | POST | Mengajukan template ke Meta |
| `/templates/:templateId/sync` | POST | Menyinkronkan status template dari Meta |
| `/templates/meta` | GET | Mendapatkan template langsung dari Meta |

#### 5.1.2 Blast Endpoints

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/blast` | POST | Membuat blast baru |
| `/blast/:blastId` | GET | Mendapatkan detail blast |
| `/blast` | GET | Mendapatkan semua blast (query: status) |
| `/blast/:blastId` | PUT | Mengupdate blast |
| `/blast/:blastId` | DELETE | Menghapus blast |
| `/blast/:blastId/send` | POST | Mengirim blast |
| `/blast/:blastId/cancel` | POST | Membatalkan blast terjadwal |

### 5.2 Komponen UI yang Dibutuhkan

#### 5.2.1 Halaman Template

- Form pembuatan/edit template sesuai format DTO
- Preview template
- List template dengan status (PENDING, SUBMITTED, APPROVED, REJECTED)
- Filter berdasarkan status
- Tombol aksi (submit, sync, delete)

#### 5.2.2 Halaman Blast

- Selector template (hanya yang APPROVED)
- Preview template terpilih
- Input penerima (individual/bulk)
- Form parameter sesuai template yang dipilih
- Form penjadwalan
- Status blast (DRAFT, SCHEDULED, PROCESSING, COMPLETED, CANCELLED, FAILED)

### 5.3 Integrasi Template-Blast

Bagian paling krusial adalah menyelaraskan template dengan parameter blast. Berikut panduan implementasinya:

#### 5.3.1 Ekstraksi Parameter Template

```typescript
function extractTemplateParameters(template) {
  const parameters = {
    header: [],
    body: [],
    buttons: []
  };
  
  // Extract dari header
  const headerComponent = template.components.find(c => c.type === 'HEADER');
  if (headerComponent && headerComponent.format === 'TEXT') {
    // Extract parameter dari header.text ({{1}})
    const headerParams = headerComponent.text.match(/{{(\d+)}}/g) || [];
    parameters.header = headerParams.map(p => parseInt(p.replace(/[{}]/g, '')));
  }
  
  // Extract dari body
  const bodyComponent = template.components.find(c => c.type === 'BODY');
  if (bodyComponent) {
    // Extract parameter dari body.text ({{1}}, {{2}}, dst)
    const bodyParams = bodyComponent.text.match(/{{(\d+)}}/g) || [];
    parameters.body = bodyParams.map(p => parseInt(p.replace(/[{}]/g, '')));
  }
  
  // Extract dari button URL
  const buttonComponent = template.components.find(c => c.type === 'BUTTONS');
  if (buttonComponent) {
    const urlButtons = buttonComponent.buttons.filter(b => b.type === 'URL');
    const buttonParams = [];
    urlButtons.forEach(button => {
      const urlParams = button.url.match(/{{(\d+)}}/g) || [];
      buttonParams.push(...urlParams.map(p => parseInt(p.replace(/[{}]/g, ''))));
    });
    parameters.buttons = buttonParams;
  }
  
  return parameters;
}
```

#### 5.3.2 Pembuatan Form Parameter Dinamis

```typescript
// Fungsi untuk membuat form parameter berdasarkan template
function createParameterForm(template, recipientNumber = null) {
  const params = extractTemplateParameters(template);
  const forms = [];
  
  // Buat form untuk parameter header jika ada
  if (params.header.length > 0) {
    forms.push({
      section: 'header',
      fields: params.header.map(paramNumber => ({
        id: `header_${paramNumber}`,
        label: `Header Parameter ${paramNumber}`,
        placeholder: 'Masukkan nilai parameter',
        required: true
      }))
    });
  }
  
  // Buat form untuk parameter body jika ada
  if (params.body.length > 0) {
    forms.push({
      section: 'body',
      fields: params.body.map(paramNumber => ({
        id: `body_${paramNumber}`,
        label: `Body Parameter ${paramNumber}`,
        placeholder: 'Masukkan nilai parameter',
        required: true
      }))
    });
  }
  
  // Buat form untuk parameter button jika ada
  if (params.buttons.length > 0) {
    forms.push({
      section: 'buttons',
      fields: params.buttons.map(paramNumber => ({
        id: `button_${paramNumber}`,
        label: `Button Parameter ${paramNumber}`,
        placeholder: 'Masukkan nilai parameter',
        required: true
      }))
    });
  }
  
  return {
    recipientNumber,
    forms
  };
}
```

#### 5.3.3 Konversi Form Nilai ke Format API

```typescript
// Konversi nilai form ke format parameters yang dibutuhkan API
function convertFormValuesToParameters(formValues, isPerRecipient = false) {
  if (isPerRecipient) {
    // Format untuk recipient-specific parameters
    const recipientParameters = {};
    
    Object.keys(formValues).forEach(recipientNumber => {
      const values = formValues[recipientNumber];
      
      recipientParameters[recipientNumber] = {
        header: Object.keys(values)
          .filter(key => key.startsWith('header_'))
          .map(key => values[key]),
          
        body: Object.keys(values)
          .filter(key => key.startsWith('body_'))
          .map(key => values[key]),
          
        buttons: Object.keys(values)
          .filter(key => key.startsWith('button_'))
          .map(key => values[key])
      };
      
      // Hapus array kosong
      if (recipientParameters[recipientNumber].header.length === 0) {
        delete recipientParameters[recipientNumber].header;
      }
      
      if (recipientParameters[recipientNumber].body.length === 0) {
        delete recipientParameters[recipientNumber].body;
      }
      
      if (recipientParameters[recipientNumber].buttons.length === 0) {
        delete recipientParameters[recipientNumber].buttons;
      }
    });
    
    return { recipientParameters };
  } else {
    // Format untuk global parameters
    const parameters = {
      header: Object.keys(formValues)
        .filter(key => key.startsWith('header_'))
        .map(key => formValues[key]),
        
      body: Object.keys(formValues)
        .filter(key => key.startsWith('body_'))
        .map(key => formValues[key]),
        
      buttons: Object.keys(formValues)
        .filter(key => key.startsWith('button_'))
        .map(key => formValues[key])
    };
    
    // Hapus array kosong
    if (parameters.header.length === 0) {
      delete parameters.header;
    }
    
    if (parameters.body.length === 0) {
      delete parameters.body;
    }
    
    if (parameters.buttons.length === 0) {
      delete parameters.buttons;
    }
    
    return { parameters };
  }
}
```

#### 5.3.4 Preview Template dengan Parameter

```typescript
function renderPreview(template, parameters) {
  let preview = JSON.parse(JSON.stringify(template)); // Deep copy
  
  // Replace parameter di header
  const headerComponent = preview.components.find(c => c.type === 'HEADER');
  if (headerComponent && headerComponent.format === 'TEXT' && parameters.header) {
    let headerText = headerComponent.text;
    parameters.header.forEach((value, index) => {
      headerText = headerText.replace(`{{${index + 1}}}`, value || `{{${index + 1}}}`);
    });
    headerComponent.text = headerText;
  }
  
  // Replace parameter di body
  const bodyComponent = preview.components.find(c => c.type === 'BODY');
  if (bodyComponent && parameters.body) {
    let bodyText = bodyComponent.text;
    parameters.body.forEach((value, index) => {
      bodyText = bodyText.replace(new RegExp(`{{${index + 1}}}`, 'g'), value || `{{${index + 1}}}`);
    });
    bodyComponent.text = bodyText;
  }
  
  // Replace parameter di button URL
  const buttonComponent = preview.components.find(c => c.type === 'BUTTONS');
  if (buttonComponent && parameters.buttons) {
    buttonComponent.buttons.forEach(button => {
      if (button.type === 'URL' && button.url) {
        let url = button.url;
        parameters.buttons.forEach((value, index) => {
          url = url.replace(`{{${index + 1}}}`, value || `{{${index + 1}}}`);
        });
        button.url = url;
      }
    });
  }
  
  return preview;
}
```

### 5.4 Validasi

#### 5.4.1 Validasi Template (Sesuai createOrUpdateTemplateSchema)

- Nama hanya huruf kecil dan garis bawah (`/^[a-z_]+$/`)
- Bahasa minimal 2, maksimal 5 karakter
- Kategori harus salah satu dari enum yang valid
- Header teks maksimal 60 karakter
- Body teks minimal 1, maksimal 1024 karakter
- Footer teks maksimal 60 karakter
- Button teks maksimal 25 karakter
- URL harus valid
- Nomor telepon hanya angka dan +

#### 5.4.2 Validasi Blast (Sesuai createBlastSchema)

- Nama hanya huruf kecil dan garis bawah (`/^[a-z_]+$/`)
- Template ID harus valid dan sudah APPROVED
- Nomor telepon format 62xxx (`/^62[0-9]{8,11}$/`)
- Minimal 1 penerima
- Semua parameter yang dibutuhkan template harus tersedia
- Format tanggal scheduledAt harus valid (ISO dengan timezone)

## 6. Hal Penting yang Perlu Diperhatikan

### 6.1 Batasan WhatsApp dan Validasi API

- Header image: max 5MB
- Header video: max 16MB
- Header document: max 100MB
- Body text: max 1024 karakter
- Footer text: max 60 karakter
- Button text: max 25 karakter
- Maksimal 3 button
- Format nomor harus 62xxx (tanpa +, spasi, atau -)
- Template harus APPROVED sebelum bisa digunakan untuk blast

### 6.2 Proses Approval Template

Template harus melewati proses approval dari Meta (status dalam database):

1. **PENDING**: Template dibuat di sistem tapi belum diajukan ke Meta
2. **SUBMITTED**: Template sudah diajukan ke Meta, menunggu keputusan
3. **APPROVED**: Template disetujui dan siap digunakan
4. **REJECTED**: Template ditolak (ada alasan penolakan)
5. **DISABLED**: Template dinonaktifkan

### 6.3 Status Blast

Blast memiliki beberapa status yang perlu ditampilkan di UI:

1. **DRAFT**: Blast dibuat tapi belum dikirim
2. **SCHEDULED**: Blast dijadwalkan untuk dikirim nanti
3. **PROCESSING**: Blast sedang diproses
4. **COMPLETED**: Blast selesai dikirim
5. **CANCELLED**: Blast dibatalkan
6. **FAILED**: Blast gagal

### 6.4 Tips Implementasi Frontend

1. **Template Builder**: Gunakan form dinamis untuk membuat template
2. **Parameter Mapper**: Ekstrak parameter dari template dan buat form sesuai
3. **Bulk Upload**: Sediakan fitur import CSV/Excel untuk data penerima dan parameternya
4. **Preview Realtime**: Tampilkan preview template dengan parameter yang diisi
5. **Validasi Client-side**: Validasi sesuai DTO sebelum submit ke API

### 6.5 Pembuatan Error Handling

```typescript
// Pesan error untuk validasi template
const templateErrors = {
  INVALID_NAME: "Nama template hanya boleh mengandung huruf kecil dan garis bawah",
  TEXT_TOO_LONG: "Teks melebihi batas maksimal karakter",
  MISSING_BODY: "Komponen body wajib ada",
  TOO_MANY_BUTTONS: "Maksimal 3 tombol per template",
  INVALID_URL: "URL tidak valid"
};

// Pesan error untuk validasi blast
const blastErrors = {
  INVALID_PHONE: "Nomor telepon harus diawali dengan 62 dan minimal 10 digit",
  MISSING_PARAMETER: "Parameter {{param}} wajib diisi untuk template ini",
  TEMPLATE_NOT_APPROVED: "Template belum disetujui oleh Meta",
  INVALID_SCHEDULE: "Waktu pengiriman harus di masa depan"
};
```

## 7. Best Practices untuk Implementasi Frontend

1. Gunakan state management (Redux/Context) untuk mengelola data template dan blast
2. Implementasikan loading state untuk semua aksi API
3. Buat reusable components untuk template preview dan parameter form
4. Sediakan cara untuk menyimpan template/blast sebagai draft
5. Implementasikan sistem notifikasi untuk approval/rejection template
6. Tampilkan statistik pengiriman pesan (sent, delivered, read, failed)
7. Sediakan fitur untuk menguji template dengan parameter sebelum blast

## 8. Contoh Implementasi UI

### 8.1 Template Form

```jsx
function TemplateForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    language: 'id',
    category: 'UTILITY',
    components: []
  });
  
  const addComponent = (type) => {
    let component;
    
    switch (type) {
      case 'HEADER':
        component = {
          type: 'HEADER',
          format: 'TEXT',
          text: ''
        };
        break;
      case 'BODY':
        component = {
          type: 'BODY',
          text: ''
        };
        break;
      case 'FOOTER':
        component = {
          type: 'FOOTER',
          text: ''
        };
        break;
      case 'BUTTONS':
        component = {
          type: 'BUTTONS',
          buttons: [{
            type: 'QUICK_REPLY',
            text: ''
          }]
        };
        break;
    }
    
    setFormData({
      ...formData,
      components: [...formData.components, component]
    });
  };
  
  // Render form fields based on DTO structure...
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Template info fields */}
      {/* Component builder fields */}
      {/* Preview */}
      {/* Submit button */}
    </form>
  );
}
```

### 8.2 Blast Form

```jsx
function BlastForm({ onSubmit }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [parameterMode, setParameterMode] = useState('global'); // 'global' or 'perRecipient'
  const [parameters, setParameters] = useState({});
  const [scheduledAt, setScheduledAt] = useState('');
  
  const loadTemplate = async (templateId) => {
    // Ambil data template dari API
    // Extract parameter requirements
    // Setup form parameter
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const data = {
      name: formData.name,
      templateId: selectedTemplate.id,
      recipients
    };
    
    // Add parameters based on mode
    if (parameterMode === 'global') {
      data.parameters = convertGlobalParameters(parameters);
    } else {
      data.recipientParameters = parameters;
    }
    
    // Add scheduledAt if present
    if (scheduledAt) {
      data.scheduledAt = scheduledAt;
    }
    
    onSubmit(data);
  };
  
  // Render form...
}
```

---

Dokumen ini akan terus diperbarui sesuai dengan perkembangan API WhatsApp dan kebutuhan sistem. 