# Panduan Implementasi Frontend ChatFlow WhatsApp

## Pendahuluan

Dokumen ini memberikan panduan untuk mengembangkan frontend yang berintegrasi dengan sistem ChatFlow WhatsApp. Panduan ini disesuaikan dengan API dan DTO yang diimplementasikan di backend untuk mengelola alur percakapan otomatis.

## 1. Struktur DTO ChatFlow

### 1.1 Format DTO ChatFlow

```typescript
// DTO untuk membuat/mengupdate flow (UpdateOrCreateFlowSchema)
interface ChatFlowDto {
  name: string;                // Nama flow
  flowJson: Record<string, MessageNode>; // Definisi alur pesan
}

// Skema untuk node pesan dalam flow
interface MessageNode {
  type: 'text' | 'interactive'; // Tipe pesan
  state: string;                // State node ini
  content: string | InteractiveContent; // Konten pesan
  options?: Record<string, string>; // Opsi/jawaban yang diharapkan
  followup?: FollowupNode;      // Node lanjutan (opsional)
}
```

### 1.2 Tipe Konten Interaktif

```typescript
// Skema untuk konten interaktif
type InteractiveContent = ButtonInteractive | ListInteractive;

// Skema untuk pesan interaktif dengan tombol
interface ButtonInteractive {
  type: 'button';
  body: string;
  buttons: Button[];  // 1-3 tombol
}

// Skema untuk pesan interaktif dengan list
interface ListInteractive {
  type: 'list';
  body: string;
  footer?: string;
  button: string;  // Teks tombol utama
  sections: Section[];
}

// Skema untuk tombol
interface Button {
  id: string;
  title: string;
}

// Skema untuk section dalam list
interface Section {
  title: string;
  rows: Row[];
}

// Skema untuk item dalam section
interface Row {
  id: string;
  title: string;
  description?: string;
}
```

### 1.3 Lokasi dan Media (followup)

```typescript
// Skema untuk node followup
interface FollowupNode {
  type: 'location';
  content: LocationContent;
}

// Skema untuk konten lokasi
interface LocationContent {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
}
```

## 2. Contoh Struktur JSON ChatFlow

```json
{
  "root": {
    "type": "text",
    "state": "root",
    "content": "Selamat datang di layanan kami! Silakan pilih:\n1. Produk\n2. Bantuan",
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
      "sections": [
        {
          "title": "Produk Populer",
          "rows": [
            {
              "id": "p1",
              "title": "Produk A",
              "description": "Deskripsi produk A"
            }
          ]
        }
      ]
    }
  }
}
```

## 3. Validasi ChatFlow

### 3.1 Validasi Umum

- **Nama Flow**: Tidak boleh kosong
- **FlowJson**: Harus memiliki minimal 1 node dan node "root" wajib ada
- **State**: Setiap node harus memiliki properti state yang unik

### 3.2 Validasi Pesan Teks

- Konten pesan teks tidak boleh kosong

### 3.3 Validasi Pesan Interaktif

#### 3.3.1 Button Type
- Body pesan tidak boleh kosong
- Minimal 1 tombol, maksimal 3 tombol
- Setiap tombol harus memiliki ID dan title yang tidak kosong

#### 3.3.2 List Type
- Body pesan tidak boleh kosong
- Teks tombol utama tidak boleh kosong
- Minimal 1 section
- Setiap section harus memiliki judul dan minimal 1 item
- Setiap item harus memiliki ID dan title yang tidak kosong

## 4. Endpoint API

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/flows` | POST | Membuat flow baru |
| `/flows` | GET | Mendapatkan semua flow milik user |
| `/flows/:flowId` | GET | Mendapatkan detail flow |
| `/flows/:flowId` | PUT | Mengupdate flow |
| `/flows/:flowId/activate` | PUT | Mengaktifkan flow (menonaktifkan flow lain) |

## 5. Implementasi Frontend

### 5.1 Komponen UI yang Dibutuhkan

- **Flow Manager**: List flow dengan status (aktif/tidak aktif)
- **Flow Editor**: Editor visual untuk membangun flowJson
- **Node Editor**: Form untuk mengedit node individual
- **Flow Previewer**: Visualisasi alur percakapan

### 5.2 Contoh Implementasi Node Editor

```jsx
function NodeEditor({ node, onUpdate }) {
  const [nodeData, setNodeData] = useState(node || {
    type: 'text',
    state: '',
    content: '',
    options: {}
  });
  
  const handleChange = (field, value) => {
    const updated = { ...nodeData, [field]: value };
    setNodeData(updated);
    onUpdate(updated);
  };
  
  return (
    <div className="node-editor">
      <div className="node-type">
        <select 
          value={nodeData.type} 
          onChange={e => handleChange('type', e.target.value)}
        >
          <option value="text">Text</option>
          <option value="interactive">Interactive</option>
        </select>
      </div>
      
      <div className="node-state">
        <input 
          type="text" 
          placeholder="State ID" 
          value={nodeData.state} 
          onChange={e => handleChange('state', e.target.value)}
        />
      </div>
      
      {nodeData.type === 'text' ? (
        <div className="text-content">
          <textarea 
            placeholder="Message content" 
            value={nodeData.content}
            onChange={e => handleChange('content', e.target.value)}
          />
        </div>
      ) : (
        <InteractiveEditor 
          content={nodeData.content} 
          onChange={content => handleChange('content', content)} 
        />
      )}
      
      <OptionsEditor 
        options={nodeData.options || {}} 
        onChange={options => handleChange('options', options)} 
      />
    </div>
  );
}
```

### 5.3 Validasi Client-side

```javascript
function validateFlow(flowData) {
  const errors = {};
  
  // Validasi nama
  if (!flowData.name) {
    errors.name = 'Nama flow tidak boleh kosong';
  }
  
  // Validasi root node
  if (!flowData.flowJson?.root) {
    errors.root = 'Flow harus memiliki node root';
  }
  
  // Validasi setiap node
  Object.entries(flowData.flowJson || {}).forEach(([nodeId, node]) => {
    // Cek state
    if (!node.state) {
      errors[`${nodeId}.state`] = 'State tidak boleh kosong';
    }
    
    // Cek konten berdasarkan tipe
    if (node.type === 'text') {
      if (!node.content) {
        errors[`${nodeId}.content`] = 'Konten pesan tidak boleh kosong';
      }
    } else if (node.type === 'interactive') {
      if (!node.content?.body) {
        errors[`${nodeId}.content.body`] = 'Body pesan tidak boleh kosong';
      }
      
      if (node.content?.type === 'button') {
        if (!node.content.buttons || node.content.buttons.length === 0) {
          errors[`${nodeId}.content.buttons`] = 'Minimal harus ada 1 tombol';
        }
        if (node.content.buttons && node.content.buttons.length > 3) {
          errors[`${nodeId}.content.buttons`] = 'Maksimal 3 tombol';
        }
      } else if (node.content?.type === 'list') {
        if (!node.content.button) {
          errors[`${nodeId}.content.button`] = 'Teks tombol utama tidak boleh kosong';
        }
        if (!node.content.sections || node.content.sections.length === 0) {
          errors[`${nodeId}.content.sections`] = 'Minimal harus ada 1 section';
        }
      }
    }
  });
  
  return errors;
}
```

## 6. Tips Implementasi

1. **Visualisasi Alur**: Gunakan diagram/graph untuk menampilkan alur percakapan
2. **Preview Mode**: Sediakan simulator untuk menguji alur percakapan
3. **Template Pesan**: Sediakan template untuk tipe pesan umum
4. **State Management**: Gunakan Redux/Context untuk mengelola state flow editor
5. **Auto-save**: Implementasikan penyimpanan otomatis untuk mencegah kehilangan data

## 7. Alur Kerja ChatFlow

1. **Pembuatan Flow**: User membuat flow dengan node-node yang saling terhubung
2. **Aktivasi Flow**: Hanya satu flow yang bisa aktif per user
3. **Pengiriman Pesan**: Saat pesan masuk, sistem akan mencari respons berdasarkan state saat ini
4. **Transisi State**: Perpindahan state terjadi berdasarkan input pengguna dan options yang didefinisikan
5. **Followup Message**: Sistem dapat mengirim pesan tambahan (followup) setelah respons utama

---

Dokumen ini akan terus diperbarui sesuai dengan perkembangan API WhatsApp dan kebutuhan sistem. 