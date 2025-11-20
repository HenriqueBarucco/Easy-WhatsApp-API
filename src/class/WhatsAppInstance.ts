import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  downloadContentFromMessage,
  extractMessageContent,
} from 'baileys';
import * as fs from 'fs';
import * as path from 'path';
import { EventsGateway } from 'src/services/events.gateway';
import SimpleStore from './SimpleStore';

@Injectable()
export class WhatsAppInstance {
  private readonly logger = new Logger(WhatsAppInstance.name);
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
  store: SimpleStore;

  constructor(
    key: string,
    @Inject(forwardRef(() => EventsGateway))
    private readonly eventsGateway: EventsGateway,
  ) {
    this.store = new SimpleStore();

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
      version: [2, 3000, 1027934701],
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
    sock?.ev.on('messages.upsert', async (m: any) => {
      const msg = m?.messages?.[0];
      if (!msg || msg.key?.fromMe) return;

      const remoteJid = msg.key?.remoteJid || '';
      const participant = msg.key?.participant as string | undefined;
      const isGroup = remoteJid.endsWith('@g.us');

      const name = msg.pushName;
      const phone =
        ((isGroup ? participant : remoteJid) || '').split('@')[0] || null;
      const group = isGroup ? remoteJid : null;
      const timestamp = msg.messageTimestamp;

      this.logger.debug(
        `Incoming message source ${JSON.stringify({ phone, group, isGroup })}`,
      );

      const content = extractMessageContent(msg.message) || msg.message;
      const type = this.resolveMessageType(content);
      this.logger.debug(`Detected message type ${type}`);

      try {
        if (type === 'conversation') {
          this.logger.debug(
            `Conversation payload ${JSON.stringify({
              name,
              phone,
              message: content?.conversation,
            })}`,
          );

          this.eventsGateway.emitEvent(this.instance.key, 'message', {
            name,
            phone,
            group,
            type: 'text',
            message: content?.conversation,
            messageTimestamp: timestamp,
          });
          return;
        }

        if (type === 'extendedTextMessage') {
          this.logger.debug(
            `Extended text payload ${JSON.stringify({
              name,
              phone,
              message: content?.extendedTextMessage?.text,
            })}`,
          );

          this.eventsGateway.emitEvent(this.instance.key, 'message', {
            name,
            phone,
            group,
            type: 'text',
            message: content?.extendedTextMessage?.text,
            messageTimestamp: timestamp,
          });
          return;
        }

        if (type === 'imageMessage') {
          const media = content.imageMessage;
          const buffer = await this.downloadMediaBuffer(media, 'image');
          const base64 = buffer.toString('base64');

          this.logger.debug(
            `Image payload ${JSON.stringify({ name, phone, message: base64 })}`,
          );

          this.eventsGateway.emitEvent(this.instance.key, 'message', {
            name,
            phone,
            group,
            type: 'image',
            mimetype: media?.mimetype || 'image/jpeg',
            caption: media?.caption || undefined,
            data: base64,
            messageTimestamp: timestamp,
          });
          return;
        }

        const fallbackMessage = this.extractFallbackMessage(type, content);
        this.eventsGateway.emitEvent(this.instance.key, 'message', {
          name,
          phone,
          group,
          type: type || 'unknown',
          message: fallbackMessage,
          messageTimestamp: timestamp,
        });
      } catch (err) {
        const fallbackMessage = this.extractFallbackMessage(type, content);
        this.eventsGateway.emitEvent(this.instance.key, 'message', {
          name,
          phone,
          group,
          type: type || 'unknown',
          message: fallbackMessage,
          error: 'failed_to_process_message',
          messageTimestamp: timestamp,
        });
      }
    });
  }

  private extractFallbackMessage(
    type: string | undefined,
    content: any,
  ): string | undefined {
    if (!content) return undefined;
    if (typeof content === 'string') return content;

    const getString = (value: any): string | undefined => {
      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }
      return undefined;
    };

    const handlers: Record<string, (payload: any) => string | undefined> = {
      conversation: (payload) => getString(payload?.conversation),
      extendedTextMessage: (payload) =>
        getString(payload?.extendedTextMessage?.text) ||
        getString(payload?.text),
      buttonsResponseMessage: (payload) =>
        getString(payload?.buttonsResponseMessage?.selectedDisplayText) ||
        getString(payload?.buttonsResponseMessage?.selectedButtonId),
      templateButtonReplyMessage: (payload) =>
        getString(payload?.templateButtonReplyMessage?.selectedDisplayText) ||
        getString(payload?.templateButtonReplyMessage?.selectedId),
      listResponseMessage: (payload) =>
        getString(
          payload?.listResponseMessage?.singleSelectReply
            ?.selectedRowDescription,
        ) ||
        getString(
          payload?.listResponseMessage?.singleSelectReply?.selectedRowId,
        ) ||
        getString(payload?.listResponseMessage?.title),
      interactiveResponseMessage: (payload) =>
        getString(payload?.interactiveResponseMessage?.body?.text) ||
        getString(
          payload?.interactiveResponseMessage?.nativeFlowResponseMessage
            ?.paramsJson,
        ),
      interactiveMessage: (payload) =>
        getString(payload?.interactiveMessage?.body?.text) ||
        getString(payload?.interactiveMessage?.footer?.text),
      buttonsMessage: (payload) =>
        getString(payload?.buttonsMessage?.contentText),
      pollCreationMessage: (payload) =>
        getString(payload?.pollCreationMessage?.name),
      pollUpdateMessage: (payload) =>
        getString(payload?.pollUpdateMessage?.vote?.[0]?.optionName),
      reactionMessage: (payload) => getString(payload?.reactionMessage?.text),
      imageMessage: (payload) => getString(payload?.imageMessage?.caption),
      videoMessage: (payload) => getString(payload?.videoMessage?.caption),
      documentMessage: (payload) =>
        getString(payload?.documentMessage?.caption) ||
        getString(payload?.documentMessage?.title),
      documentWithCaptionMessage: (payload) =>
        getString(
          payload?.documentWithCaptionMessage?.message?.documentMessage
            ?.caption,
        ),
    };

    if (type && handlers[type]) {
      const handled = handlers[type](content);
      if (handled) return handled;
    }

    const sources = [] as any[];
    if (type && Object.prototype.hasOwnProperty.call(content, type)) {
      sources.push(content[type]);
    }
    sources.push(content);

    for (const src of sources) {
      if (!src || typeof src !== 'object') continue;
      const direct =
        getString(src.text) ||
        getString(src.caption) ||
        getString(src.contentText) ||
        getString(src.body?.text);
      if (direct) return direct;
    }

    return undefined;
  }

  private resolveMessageType(content: any): string | undefined {
    if (!content || typeof content !== 'object') return undefined;

    const prioritizedKeys = [
      'conversation',
      'extendedTextMessage',
      'imageMessage',
      'videoMessage',
      'audioMessage',
      'documentMessage',
      'documentWithCaptionMessage',
      'stickerMessage',
      'locationMessage',
      'liveLocationMessage',
      'contactMessage',
      'contactsArrayMessage',
      'buttonsMessage',
      'buttonsResponseMessage',
      'templateButtonReplyMessage',
      'listMessage',
      'listResponseMessage',
      'interactiveMessage',
      'interactiveResponseMessage',
      'pollCreationMessage',
      'pollUpdateMessage',
      'reactionMessage',
      'protocolMessage',
    ];

    for (const key of prioritizedKeys) {
      if (Object.prototype.hasOwnProperty.call(content, key)) return key;
    }

    const ignoredKeys = new Set([
      'senderKeyDistributionMessage',
      'messageContextInfo',
      'deviceListMetadata',
      'deviceListMetadataVersion',
    ]);

    const keys = Object.keys(content);
    for (const key of keys) {
      if (!ignoredKeys.has(key)) return key;
    }

    return keys[0];
  }

  private async downloadMediaBuffer(
    mediaMessage: any,
    mediaType: 'image' | 'video' | 'audio' | 'document' | 'sticker',
  ): Promise<Buffer> {
    const stream = await downloadContentFromMessage(mediaMessage, mediaType);
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    const buffers = chunks.map((c) => new Uint8Array(c));
    const total = buffers.reduce((sum, b) => sum + b.length, 0);
    const out = Buffer.alloc(total);
    let offset = 0;
    for (const b of buffers) {
      out.set(b, offset);
      offset += b.length;
    }
    return out;
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

  async sendLocationMessage(
    phone: string,
    latitude: number,
    longitude: number,
    locationName?: string,
    address?: string,
  ) {
    await this.verifyId(this.getWhatsAppId(phone));
    const locationPayload: {
      degreesLatitude: number;
      degreesLongitude: number;
      name?: string;
      address?: string;
    } = {
      degreesLatitude: latitude,
      degreesLongitude: longitude,
    };

    if (locationName) {
      locationPayload.name = locationName;
    }

    if (address) {
      locationPayload.address = address;
    }

    const data = await this.instance.sock?.sendMessage(
      this.getWhatsAppId(phone),
      {
        location: locationPayload,
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
