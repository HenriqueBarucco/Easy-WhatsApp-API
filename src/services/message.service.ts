import { Injectable, NotFoundException } from '@nestjs/common';
import { InstanceService } from './instance.service';
import { SendTextDto } from 'src/controllers/message.controller';

@Injectable()
export class MessageService {
  constructor(private instanceService: InstanceService) {}

  async sendText(key: string, sendTextDto: SendTextDto): Promise<any> {
    const instance = this.instanceService.getInstance(key);

    if (!instance || !(await instance).instance.online) {
      throw new NotFoundException('Instance not found or offline');
    }

    (await instance).sendTextMessage(sendTextDto.phone, sendTextDto.message);

    return {
      message: 'Text message sent successfully',
    };
  }

  async teste(key: string): Promise<any> {
    const instance = this.instanceService.getInstance(key);

    if (!instance) {
      throw new NotFoundException('Instance not found');
    }

    const chats = (await instance).instance.messages;

    return chats;
  }
}
