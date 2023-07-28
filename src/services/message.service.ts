import { Injectable, NotFoundException } from '@nestjs/common';
import { InstanceService } from './instance.service';
import { SendTextDto } from 'src/controllers/message.controller';

@Injectable()
export class MessageService {
  constructor(private instanceService: InstanceService) {}

  async sendText(key: string, sendTextDto: SendTextDto): Promise<any> {
    const instance = this.instanceService.getInstance(key);

    if (!instance) {
      throw new NotFoundException('Instance not found');
    }

    (await instance).sendTextMessage(sendTextDto.phone, sendTextDto.message);

    return {
      message: 'Text message sent successfully',
    };
  }
}
