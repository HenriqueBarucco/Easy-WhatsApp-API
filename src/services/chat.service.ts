import { Injectable, NotFoundException } from '@nestjs/common';
import { InstanceService } from './instance.service';

@Injectable()
export class ChatService {
  constructor(private instanceService: InstanceService) {}

  async chat(key: string): Promise<any> {
    const instance = this.instanceService.getInstance(key);

    if (!instance) {
      throw new NotFoundException('Instance not found');
    }

    const chats = (await instance).instance.messages;

    return this.processObject(chats);
  }

  async contactsRecent(key: string): Promise<any[]> {
    const instance = this.instanceService.getInstance(key);

    if (!instance) {
      throw new NotFoundException('Instance not found');
    }

    const contacts = (await instance).instance.chats;
    const phone = (await (await instance).getInstanceDetails()).user?.id.split(
      ':',
    )[0];

    const contactMap = new Map<string, boolean>();

    contacts.forEach((contact) => {
      if (
        contact.unreadCount >= 0 &&
        !contact.id.includes('status') &&
        !contact.id.includes(phone)
      ) {
        const phoneWithoutDomain = contact.id.split('@')[0];
        contactMap.set(phoneWithoutDomain, true);
      }
    });

    const uniqueContacts = Array.from(contactMap.keys()).map((phone) => ({
      phone,
    }));

    const contactsWithPictures = await Promise.all(
      uniqueContacts.map(async (contact) => ({
        ...contact,
        picture: await (await instance).getProfilePicture(contact.phone),
      })),
    );

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

    if (!instance) {
      throw new NotFoundException('Instance not found');
    }

    return (instance as any).getProfilePicture(phone);
  }
}
