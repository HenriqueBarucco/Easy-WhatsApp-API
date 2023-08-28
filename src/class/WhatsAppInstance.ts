import { Inject } from '@nestjs/common';
import makeWASocket, {
  Contact,
  DisconnectReason,
  makeInMemoryStore,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import * as fs from 'fs';
import * as path from 'path';
import { EventsGateway } from 'src/services/events.gateway';

export class WhatsAppInstance {
  instance = {
    key: '',
    qr: '',
    chats: [],
    messages: null,
    contacts: null,
    online: false,
    sock: null,
    auth: null,
  };
  qrcode: any;
  store = makeInMemoryStore({});

  constructor(
    key: string,
    @Inject('EventsGateway') private readonly eventsGateway: EventsGateway,
  ) {
    this.instance.key = key;
    this.qrcode = require('qrcode');
    this.store.readFromFile(`sessions/${this.instance.key}/store.json`);
    setInterval(() => {
      this.store.writeToFile(`sessions/${this.instance.key}/store.json`);
    }, 10_000);
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

    this.store.bind(this.instance.sock.ev);

    this.instance.chats = this.store.chats.all();
    //this.instance.messages = this.store.messages.all();
    this.instance.messages = this.store.messages;

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
          this.eventsGateway.emitEvent(
            this.instance.key,
            'instanceDisconnected',
            {},
          );

          await this.init();
        }
      } else if (connection === 'open') {
        this.instance.online = true;
        this.eventsGateway.emitEvent(this.instance.key, 'qrCodeSuccess');
      }

      if (qr) {
        this.qrcode.toDataURL(qr).then((url) => {
          this.instance.qr = url;
          this.eventsGateway.emitEvent(this.instance.key, 'qrCodeChanged', {
            url,
          });
        });
      }
    });

    // When the instance is connected for th first time
    sock.ev.on('messaging-history.set', async ({ chats }) => {
      this.instance.chats.push(...chats);
      this.instance.messages = this.store.messages;
      this.instance.contacts = this.store.contacts;
    });

    // When a new message is received
    sock?.ev.on('messages.upsert', (m: any) => {
      if (m.messages[0].key.fromMe) return;

      this.eventsGateway.emitEvent(this.instance.key, 'message', {
        name: m.messages[0].pushName,
        phone: m.messages[0].key.remoteJid.split('@')[0],
        message: m.messages[0].message?.conversation,
        messageTimestamp: m.messages[0].messageTimestamp,
      });
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
    //throw new Error('No account exists');
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

  async sendMediaFile(
    phone: string,
    file,
    type,
    caption = '',
    filename: string,
  ) {
    await this.verifyId(this.getWhatsAppId(phone));
    const data = await this.instance.sock?.sendMessage(
      this.getWhatsAppId(phone),
      {
        mimetype: file.mimetype,
        [type]: file.buffer,
        caption: caption,
        ptt: type === 'audio' ? true : false,
        fileName: filename ? filename : file.originalname,
      },
    );
    return data;
  }

  async getInstanceDetails() {
    return {
      instance_key: this.instance.key,
      connected: this.instance?.online,
      user: this.instance?.online ? this.instance.sock?.user : null,
    };
  }

  async getContacts(): Promise<any> {
    return this.store.contacts;
  }

  async getProfilePicture(phone: string) {
    const exists = await this.verifyId(this.getWhatsAppId(phone));
    if (!exists) return null;
    try {
      const data = await this.instance.sock?.profilePictureUrl(
        this.getWhatsAppId(phone),
      );
      return data;
    } catch (error) {
      // TODO : Handle error SE QUISER
    }
  }
}
