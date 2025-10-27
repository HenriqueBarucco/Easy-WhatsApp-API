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
      chats.map(async (contact) => {
        if (
          contact.unreadCount >= 0 &&
          !contact.id.includes('status') &&
          !contact.id.includes(phone)
        ) {
          this.logger.debug(
            `Recent contact ${JSON.stringify(contacts[contact.id])}`,
          );
          return {
            phone: contact.id.split('@')[0],
            name:
              contacts[contact.id]?.name ||
              contacts[contact.id]?.notify ||
              contact.id.split('@')[0],
            picture: await (await instance).getProfilePicture(contact.id),
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
      contactsWithPictures.push({
        phone: contact.id.split('@')[0],
        notify: contact.notify,
        name: contact.name,
        picture: await (await instance).getProfilePicture(contact.id),
      });
    }
    return contactsWithPictures;
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
