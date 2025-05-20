import prisma from '../config/database.js';
import { WhatsAppService } from './whatsapp.service.js';
import  packageService  from './package.service.js';
import { config } from '../config/config.js';
import axios from 'axios';
/**
 * Service untuk mengelola chatbot flow dan state pengguna
 */
export class ChatbotService {
  static baseUrl = config.whatsapp.baseUrl;
  static apiVersion = config.whatsapp.apiVersion;
  static accessToken = config.whatsapp.accessToken;
  static WABA_ID = config.whatsapp.wabaId
  /**
   * Membuat flow chatbot baru
   * @param {string} userId - ID pemilik flow
   * @param {string} name - Nama flow
   * @param {Object} flowJson - Definisi flow dalam format JSON
   * @returns {Promise<Object>} Flow yang dibuat
   */
  static async createFlow(userId, name, flowJson) {
    return await prisma.chatFlow.create({
      data: {
        userId,
        name,
        flowJson
      }
    });
  }

  /**
   * Mengupdate flow chatbot
   * @param {string} flowId - ID flow yang akan diupdate
   * @param {string} name - Nama flow baru (opsional)
   * @param {Object} flowJson - Definisi flow baru (opsional)
   * @param {boolean} isActive - Status aktif (opsional)
   * @returns {Promise<Object>} Flow yang diupdate
   */
  static async updateFlow(flowId, { name, flowJson, isActive }) {
    return await prisma.chatFlow.update({
      where: { id: flowId },
      data: { name, flowJson, isActive }
    });
  }

  /**
   * Mendapatkan flow chatbot berdasarkan ID
   * @param {string} flowId - ID flow
   * @returns {Promise<Object>} Data flow
   */
  static async getFlowById(flowId) {
    return await prisma.chatFlow.findUnique({
      where: { id: flowId }
    });
  }

  /**
   * Mendapatkan semua flow chatbot milik user
   * @param {string} userId - ID pemilik flow
   * @returns {Promise<Array>} Daftar flow
   */
  static async getFlowsByUser(userId) {
    return await prisma.chatFlow.findMany({
      where: { userId }
    });
  }

  /**
   * Mendapatkan flow chatbot aktif milik user
   * @param {string} userId - ID pemilik flow
   * @returns {Promise<Object>} Flow aktif
   */
  static async getActiveFlow(userId) {
    return await prisma.chatFlow.findFirst({
      where: {
        userId,
        isActive: true
      }
    });
  }

  /**
   * Menghapus flow chatbot
   * @param {string} flowId - ID flow yang akan dihapus
   * @returns {Promise<Object>} Flow yang dihapus
   */
  static async deleteFlow(flowId) {
    return await prisma.chatFlow.delete({
      where: { id: flowId }
    });
  }

  /**
   * Mendapatkan atau membuat state percakapan
   * @param {string} userId - ID pemilik flow
   * @param {string} waNumber - Nomor WhatsApp pengunjung
   * @returns {Promise<Object>} State percakapan
   */
  static async getOrCreateChatState(userId, waNumber) {
    let chatState = await prisma.chatState.findUnique({
      where: {
        userId_waNumber: {
          userId,
          waNumber
        }
      }
    });
    
    if (!chatState) {
      chatState = await prisma.chatState.create({
        data: {
          userId,
          waNumber,
          currentState: 'root'
        }
      });
    }
    
    return chatState;
  }

  /**
   * Mengupdate state percakapan
   * @param {string} userId - ID pemilik flow
   * @param {string} waNumber - Nomor WhatsApp pengunjung
   * @param {string} newState - State baru
   * @returns {Promise<Object>} State percakapan yang diupdate
   */
  static async updateChatState(userId, waNumber, newState) {
    return await prisma.chatState.update({
      where: {
        userId_waNumber: {
          userId,
          waNumber
        }
      },
      data: {
        currentState: newState
      }
    });
  }

  static async getNextNodeId(message) {
    console.log(message);
    
    if (message.type === "text" && message.text?.body) {
      return message.text.body.trim().toLowerCase();
    }
    if (message.type === "interactive") {
      if (message.interactive.button_reply) return message.button_reply.id;
      if (message.interactive.list_reply) {
        // console.log(message.list_reply);
        
        return message.interactive.list_reply.id;
      }
    }
    return null;
  }


  // === Buat payload berdasarkan isi node JSON ===
  static async buildMessagePayload(node) {
    if (!node) return null;

    switch (node.type) {
      case "text":
        return {
          type: "text",
          text: { body: node.content },
        };

      case "image":
        return {
          type: "image",
          image: {
            link: node.content.link,
            caption: node.content.caption || "",
          },
        };

      case "document":
        return {
          type: "document",
          document: {
            link: node.content.link,
            filename: node.content.filename,
            caption: node.content.caption || "",
          },
        };

      case "location":
        return {
          type: "location",
          location: node.content,
        };

      case "interactive":
        if (node.content.type === "button") {
          return {
            type: "interactive",
            interactive: {
              type: "button",
              body: { text: node.content.body },
              action: {
                buttons: node.content.buttons.map((btn) => ({
                  type: "reply",
                  reply: {
                    id: btn.id,
                    title: btn.title,
                  },
                })),
              },
            },
          };
        } else if (node.content.type === "list") {
          return {
            type: "interactive",
            interactive: {
              type: "list",
              body: { text: node.content.body },
              action: {
                button: node.content.button,
                sections: node.content.sections.map((section) => ({
                  title: section.title,
                  rows: section.rows.map((row) => ({
                    id: row.id,
                    title: row.title,
                    description: row.description || "",
                  })),
                })),
              },
            },
          };
        }
        break;

      default:
        return null;
    }
  }

  // === Fungsi Kirim Pesan ke Meta ===
  static async sendMessage(to, messagePayload,from) {
    // console.log(messagePayload);
    
    
      const response = await axios.post(
        `https://graph.facebook.com/${this.apiVersion}/${from}/messages`,
        {
          messaging_product: "whatsapp",
          to,
          ...messagePayload
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Pesan terkirim:", response.data);

      // await packageService.recordMessageUsage(userId, 1);
  }

  /**
   * Memproses pesan masuk dan mengembalikan respons sesuai flow
   * @param {string} userId - ID pemilik flow
   * @param {string} waNumber - Nomor WhatsApp pengunjung
   * @param {string} message - Pesan yang diterima
   * @param {string} phoneNumberId - ID nomor telepon pengirim
   * @returns {Promise<Object>} Hasil proses
   */
  static async processIncomingMessage(userId, senderNumber, message, phoneNumberId) {
    try {
      // await WhatsAppService.checkMessageQuota(userId);
      if (!["text","interactive"].includes(message.type)) throw new Error('format file tidak didukung');
      // Dapatkan flow aktif
      const activeFlow = await this.getActiveFlow(userId);
      if (!activeFlow) {
        throw new Error('Tidak ada flow chatbot yang aktif');
      }

      let nodeId = await this.getNextNodeId(message)
      let messagePayload = null

      // log incoming message
      WhatsAppService.logIncomingMessage(userId,senderNumber,message,nodeId)

      // Dapatkan atau buat state
      const flowJson = activeFlow.flowJson;
      
      let chatState = await prisma.chatState.findFirst({
        where: { waNumber : senderNumber, userId : userId }
      });

      const currentFlow = flowJson[nodeId]

      if (!chatState) {
        if (!currentFlow) nodeId = "root" 
      }else {
        const flowByState = flowJson.filter((flow) => flow.state == chatState.currentState)
        const currentFlowByState = flowByState[nodeId]
        if (!currentFlowByState) 
          {
            // "send perintah tidak diketahui silahkan mengetik /menu untuk melihat menu yang ada"
            if (!currentFlow) await WhatsAppService.sendTextMessage(
              phoneNumberId,
              senderNumber,
              "perintah tidak diketahui silahkan mengetik /root untuk melihat menu yang ada"
              
            ) 
            else messagePayload = currentFlow
            
          }else messagePayload = currentFlowByState
      }
      console.log(nodeId);
      // console.log(flowJson);

      messagePayload = !messagePayload ? await this.buildMessagePayload(flowJson[nodeId]) : messagePayload
      console.log(messagePayload);

      if (messagePayload) {
        await this.sendMessage(senderNumber,messagePayload,phoneNumberId)
        // log outgoing message
        WhatsAppService.logOutgoingMessage(userId,senderNumber,nodeId,messagePayload.state)
        if (chatState) await this.updateChatState(userId,senderNumber,messagePayload.state)
        else await this.getOrCreateChatState(userId,senderNumber)
      }
    } catch (error) {
      console.error('Error processing incoming message:',error.message)
      // Coba kirim pesan error jika phoneNumberId tersedia
      if (phoneNumberId && senderNumber) {
        const errorMessage = 'Mohon maaf, terjadi kesalahan. Silakan coba lagi nanti.';
        
        try {
          // Kirim pesan root
          await WhatsAppService.sendTextMessage(
            phoneNumberId,
            senderNumber,
            errorMessage
          );
          
          // Log pesan keluar
          // await WhatsAppService.logOutgoingMessage(userId, senderNumber, errorMessage, 'error');
        } catch (sendError) {
          console.error('Error sending error message:', sendError);
        }
      }
    }
  }
} 