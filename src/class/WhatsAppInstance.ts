import { NotFoundException } from '@nestjs/common';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import * as fs from 'fs';
import * as path from 'path';

export class WhatsAppInstance {
  instance = {
    key: '',
    qr: '',
    chats: [],
    messages: [],
    online: false,
    sock: null,
    auth: null,
  };
  qrcode: any;

  constructor(key: string) {
    this.instance.key = key;
    this.qrcode = require('qrcode');
  }

  async init() {
    const { state, saveCreds } = await useMultiFileAuthState(
      `sessions/${this.instance.key}`,
    );
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
          this.deleteFolderRecursive(`sessions/${this.instance.key}`);
          this.instance.online = false;

          await this.init();
        }
      } else if (connection === 'open') {
        this.instance.online = true;
      }

      if (qr) {
        this.qrcode.toDataURL(qr).then((url) => {
          this.instance.qr = url;
        });
      }
    });
  }

  deleteFolderRecursive(folderPath: string) {
    if (fs.existsSync(folderPath)) {
      fs.readdirSync(folderPath).forEach((file) => {
        const curPath = path.join(folderPath, file);
        if (fs.lstatSync(curPath).isDirectory()) {
          this.deleteFolderRecursive(curPath);
        } else {
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(folderPath);
    }
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
