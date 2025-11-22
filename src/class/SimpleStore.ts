import * as fs from 'fs';
import * as path from 'path';

type BaileysEventEmitter = {
  on: (event: string, listener: (...args: any[]) => void) => void;
};

export class SimpleStore {
  private chatsArr: any[] = [];
  private messagesMap: Record<string, any[]> = {};
  private contactsMap: Record<string, any> = {};

  chats = {
    all: () => this.chatsArr,
  };

  get messages() {
    return this.messagesMap;
  }

  get contacts() {
    return this.contactsMap;
  }

  bind(ev: BaileysEventEmitter) {
    ev.on('messaging-history.set', ({ chats, contacts, messages }: any) => {
      if (Array.isArray(chats)) this.replaceArray(this.chatsArr, chats);
      if (Array.isArray(contacts)) this.replaceContacts(contacts);
      if (Array.isArray(messages)) {
        for (const m of messages) this.addMessage(m);
      }
    });

    ev.on('chats.upsert', (upsert: any) => {
      if (!Array.isArray(upsert)) return;
      for (const chat of upsert) {
        const idx = this.chatsArr.findIndex((c) => c?.id === chat?.id);
        if (idx >= 0) this.chatsArr[idx] = { ...this.chatsArr[idx], ...chat };
        else this.chatsArr.push(chat);
      }
    });

    ev.on('contacts.upsert', (contacts: any[]) => {
      if (!Array.isArray(contacts)) return;
      for (const c of contacts) if (c?.id) this.contactsMap[c.id] = c;
    });

    ev.on('messages.upsert', (payload: any) => {
      if (!payload || !Array.isArray(payload.messages)) return;
      for (const m of payload.messages) this.addMessage(m);
    });
  }

  readFromFile(filePath: string) {
    try {
      if (!fs.existsSync(filePath)) return;
      const raw = fs.readFileSync(filePath, 'utf-8');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (Array.isArray(data.chats))
        this.replaceArray(this.chatsArr, data.chats);
      if (data.messages && typeof data.messages === 'object')
        this.replaceMap(this.messagesMap, data.messages);
      if (data.contacts && typeof data.contacts === 'object')
        this.replaceMap(this.contactsMap, data.contacts);
    } catch (_e) {
      // ignore corrupt files
    }
  }

  writeToFile(filePath: string) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const data = {
        chats: this.chatsArr,
        messages: this.messagesMap,
        contacts: this.contactsMap,
      };
      fs.writeFileSync(filePath, JSON.stringify(data));
    } catch (_e) {
      // ignore write errors
    }
  }

  private addMessage(m: any) {
    const jid = m?.key?.remoteJid;
    if (!jid) return;
    if (!this.messagesMap[jid]) this.messagesMap[jid] = [];
    this.messagesMap[jid].push(m);
  }

  private replaceArray(target: any[], source: any[]) {
    target.length = 0;
    target.push(...source);
  }

  private replaceContacts(contacts: any[]) {
    for (const key of Object.keys(this.contactsMap))
      delete this.contactsMap[key];
    for (const c of contacts) if (c?.id) this.contactsMap[c.id] = c;
  }

  private replaceMap(target: Record<string, any>, source: Record<string, any>) {
    for (const key of Object.keys(target)) delete target[key];
    Object.assign(target, source);
  }
}

export default SimpleStore;
