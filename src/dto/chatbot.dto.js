import { z } from 'zod';

// Tombol balasan cepat (untuk button type)
const buttonSchema = z.object({
  id: z.string({required_error : "id is required",message : "id should be a string"}).min(1, { message: "ID tombol tidak boleh kosong" }),
  title: z.string({required_error : "title is required",message : "title should be a string"}).min(1, { message: "Judul tombol tidak boleh kosong" }),
});

// Interactive message - button type
const buttonInteractiveSchema = z.object({
  type: z.literal("button", {required_error : "  is required",message : "type should be a string"}),
  body: z.string({required_error : "body is required",message : "body should be a string"}).min(1, { message: "Konten pesan tidak boleh kosong" }),
  buttons: z.array(buttonSchema, {required_error : "buttons is required",message : "buttons should be an array"}).min(1, { message: "Minimal harus ada 1 tombol" }).max(3, { message: "Maksimal hanya 3 tombol" }),
});

// Interactive message - list type
const listInteractiveSchema = z.object({
  type: z.literal("list", {required_error : "type is required",message : "type should be a string"}),
  body: z.string({required_error : "body is required",message : "body should be a string"}).min(1, { message: "Konten pesan tidak boleh kosong" }),
  footer: z.string({required_error : "footer is required",message : "footer should be a string"}).optional(),
  button: z.string({required_error : "button is required",message : "button should be a string"}).min(1, { message: "Teks tombol utama tidak boleh kosong" }), // teks tombol utama
  sections: z.array(
    z.object({
      title: z.string({required_error : "title is required",message : "title should be a string"}).min(1, { message: "Judul section tidak boleh kosong" }),
      rows: z.array(
        z.object({
          id: z.string({required_error : "id is required",message : "id should be a string"}).min(1, { message: "ID item tidak boleh kosong" }),
          title: z.string().min(1, { message: "Judul item tidak boleh kosong" }),
          description: z.string().optional(),
        })
      ).min(1, { message: "Minimal harus ada 1 item dalam section" }),
    })
  ,{required_error : "sections is required",message : "sections should be an array"}).min(1, { message: "Minimal harus ada 1 section" }),
});

// Gabungkan interactive content (button + list)
const interactiveContentSchema = z.discriminatedUnion("type", [
  buttonInteractiveSchema,
  listInteractiveSchema,
]);

// Tipe lain (image, document, location)
const imageContentSchema = z.object({
  link: z.string({required_error : "link is required",message : "link should be a string"}).url({ message: "Link gambar harus berupa URL yang valid" }),
  caption: z.string({required_error : "caption is required",message : "caption should be a string"}).optional(),
});

const documentContentSchema = z.object({
  link: z.string({required_error : "link is required",message : "link should be a string"}).url({ message: "Link dokumen harus berupa URL yang valid" }),
  filename: z.string({required_error : "filename is required",message : "filename should be a string"}).min(1, { message: "Nama file tidak boleh kosong" }),
  caption: z.string({required_error : "caption is required",message : "caption should be a string"}).optional(),
});

const locationContentSchema = z.object({
  latitude: z.number({ required_error : "latitude is required", message: "latitude harus berupa angka" }),
  longitude: z.number({ required_error : "longitude is required", message: "longitude harus berupa angka" }),
  name: z.string({required_error : "name is required",message : "name should be a string"}).min(1, { message: "Nama lokasi tidak boleh kosong" }),
  address: z.string({required_error : "address is required"}).min(1, { message: "Alamat tidak boleh kosong" }),
});

// Message node
const messageSchema = z.object({
  type: z.enum(["text", "interactive"], {
    errorMap: (issue, ctx) => ({ message: "Tipe pesan tidak valid. Pilih salah satu: text, interactive, image, document, location", required_error : "type is required" })
  }),
  state: z.string({required_error : "state is required",message : "state should be a string"}).min(1, { message: "state tidak boleh kosong" }),
  content: z.union([
    z.string().min(1, { message: "content pesan tidak boleh kosong" }), // untuk text
    interactiveContentSchema,
    // imageContentSchema,
    // documentContentSchema,
    // locationContentSchema,
  ], {
    errorMap: (issue, ctx) => ({ message: "Format content tidak valid", required_error : "content is required" })
  }),
  options: z.record(z.string()).optional(),
  followup: z
    .object({
      type: z.literal("location"),
      content: locationContentSchema,
    })
    .optional(),
});

// Root flow schema
export const UpdateOrCreateFlowSchema = z.object({
  name: z.string({required_error : "Name is required",message : "name should be a string"}).min(1, { message: "Nama flow tidak boleh kosong" }),
  flowJson: z.record(messageSchema, { message: "Format flow tidak valid" , required_error : "Flow Json is required"}),
});