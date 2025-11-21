import { Injectable, Logger } from '@nestjs/common';
import { InstanceService } from './instance.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  constructor(private instanceService: InstanceService) {}

  async chat(key: string): Promise<any> {
    const instance = this.instanceService.getInstance(key);

    const chats = (await instance).instance.messages;

    return this.processObject(chats);
  }

  async contactsRecent(key: string): Promise<any[]> {
    const instance = this.instanceService.getInstance(key);

    const chats = (await instance).instance.chats;
    const contacts = await (await instance).getContacts();

    const phone = (await (await instance).getInstanceDetails()).user?.id.split(
      ':',
    )[0];

    const contactsWithPictures = await Promise.all(
      chats.map(async (chat) => {
        if (
          chat.id &&
          !chat.id.includes('@g.us') &&
          !chat.id.includes('status') &&
          !chat.id.includes(phone)
        ) {
          const contactInfo = contacts[chat.id];
          this.logger.debug(`Recent contact ${JSON.stringify(contactInfo)}`);
          return {
            id: chat.id,
            phone: chat.id.split('@')[0],
            name:
              contactInfo?.name ||
              contactInfo?.notify ||
              chat.name ||
              chat.id.split('@')[0],
            picture: await (await instance).getProfilePicture(chat.id),
          };
        }
      }),
    );

    const filteredContacts = contactsWithPictures.filter(
      (contact) => contact !== undefined,
    );

    return filteredContacts;
  }

  async contactsAll(key: string): Promise<any[]> {
    const instance = this.instanceService.getInstance(key);

    const contacts = await (await instance).getContacts();

    const contactsWithPictures = [];

    for (const contact of Object.values(contacts) as any) {
      if (contact?.id && !contact.id.includes('@g.us')) {
        contactsWithPictures.push({
          id: contact.id,
          phone: contact.id.split('@')[0],
          notify: contact.notify,
          name: contact.name || contact.notify || contact.id.split('@')[0],
          picture: await (await instance).getProfilePicture(contact.id),
        });
      }
    }
    return contactsWithPictures;
  }

  async groups(key: string): Promise<any[]> {
    const instance = this.instanceService.getInstance(key);

    const chats = (await instance).instance.chats;

    const groupsWithPictures = await Promise.all(
      chats
        .filter((chat) => chat.id && chat.id.includes('@g.us'))
        .map(async (group) => {
          return {
            id: group.id,
            name: group.name || group.id.split('@')[0],
            picture: await (await instance).getProfilePicture(group.id),
          };
        }),
    );

    return groupsWithPictures;
  }

  private processObject(inputObject) {
    const result = {};

    for (const [key, messages] of Object.entries(inputObject)) {
      const phone = key.split('@')[0];

      result[phone] = {
        ...result[phone],
      };

      const messageArray = Array.isArray(messages) ? messages : [messages];

      for (const messageData of messageArray) {
        const messages = this.extractMessages(messageData);

        result[phone] = {
          ...result[phone],
          messages,
        };
      }
    }

    return result;
  }

  private extractMessages(data) {
    const messagesAndKeys = [];

    data.array.forEach((webMessageInfo) => {
      const { message, messageTimestamp, pushName, key } = webMessageInfo;
      const text = message?.extendedTextMessage?.text || message?.conversation;

      if (!text) {
        return;
      }

      const messageContext = {
        name: key.fromMe ? 'me' : pushName || '',
        message: text || '',
        messageTimestamp: messageTimestamp.toString(),
      };

      messagesAndKeys.push(messageContext);
    });

    return messagesAndKeys;
  }

  contactPicture(key: any, phone: string): Promise<any> {
    const instance = this.instanceService.getInstance(key);

    return (instance as any).getProfilePicture(phone);
  }
}
