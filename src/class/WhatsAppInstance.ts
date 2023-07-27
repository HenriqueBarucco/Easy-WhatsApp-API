import { NotFoundException } from '@nestjs/common';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';

export class WhatsAppInstance {
  instance = {
    key: '',
    qr: '',
    chats: [],
    messages: [],
    online: false,
    qrRetry: 0,
    sock: null,
    auth: null,
  };
  qrcode: any;

  constructor(key: string) {
    this.instance.key = key;
    this.qrcode = require('qrcode');
  }

  async init() {
    const { state, saveCreds } = await useMultiFileAuthState('sessions');
    this.instance.auth = { state: state, saveCreds: saveCreds };

    const connection = makeWASocket({
      printQRInTerminal: false,
      markOnlineOnConnect: true,
      defaultQueryTimeoutMs: 60000,
      syncFullHistory: false,
      auth: {
        ...state,
      },
    });

    this.instance = {
      ...this.instance,
      sock: connection,
    };

    this.SocketEvents();
    return this;
  }

  SocketEvents() {
    const sock = this.instance.sock;

    sock?.ev.on('creds.update', this.instance.auth.saveCreds);

    sock?.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (connection === 'connecting') return;

      if (connection === 'close') {
        if (
          lastDisconnect?.error?.output?.statusCode !==
          DisconnectReason.loggedOut
        ) {
          await this.init();
        } else {
          // TODO delete instance from array
          this.instance.online = false;
        }
      } else if (connection === 'open') {
        this.instance.online = true;
      }

      if (qr) {
        this.qrcode.toDataURL(qr).then((url) => {
          this.instance.qr = url;
          this.instance.qrRetry++;
          if (this.instance.qrRetry >= 3) {
            this.instance.sock.ws.close();
            this.instance.sock.ev.removeAllListeners();
            this.instance.qr = '';
            // TODO log connection terminated
          }
        });
      }
    });
  }

  getWhatsAppId(id: string) {
    if (id.includes('@g.us') || id.includes('@s.whatsapp.net')) return id;
    return id.includes('-') ? `${id}@g.us` : `${id}@s.whatsapp.net`;
  }

  async verifyId(id: string) {
    if (id.includes('@g.us')) return true;
    const [result] = await this.instance.sock?.onWhatsApp(id);
    if (result?.exists) return true;
    throw new NotFoundException('no account exists');
  }

  async sendTextMessage(phone: string, message: string) {
    await this.verifyId(this.getWhatsAppId(phone));
    const data = await this.instance.sock?.sendMessage(
      this.getWhatsAppId(phone),
      {
        text: message,
      },
    );
    return data;
  }
}
