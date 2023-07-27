import { Injectable, NotFoundException } from '@nestjs/common';
import { SendTextDto } from './message.controller';
import { InstanceService } from 'src/instance/instance.service';

@Injectable()
export class MessageService {
  constructor(private instanceService: InstanceService) {}

  async sendText(key: string, sendTextDto: SendTextDto): Promise<any> {
    const instance = this.instanceService.getInstance(key);

    if (!instance) {
      throw new NotFoundException('Instance not found');
    }

    (await instance).sendTextMessage(sendTextDto.phone, sendTextDto.message);

    /* console.log('sendTextDto', sendTextDto);
    console.log('key', key); */
    return {
      message: 'Text message sent successfully',
    };
  }
}
