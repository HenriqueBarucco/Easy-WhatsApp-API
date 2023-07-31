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

  async contactsRecent(key: string): Promise<any> {
    const instance = this.instanceService.getInstance(key);

    if (!instance) {
      throw new NotFoundException('Instance not found');
    }

    const contacts = (await instance).instance.chats;
    const phone = (await (await instance).getInstanceDetails()).user?.id.split(
      ':',
    )[0];

    return contacts.reduce((acc, contact) => {
      if (
        contact.unreadCount > 0 &&
        !contact.id.includes('status') &&
        !contact.id.includes(phone)
      ) {
        acc.push({ phone: contact?.id.split('@')[0] });
      }
      return acc;
    }, []);
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
}
