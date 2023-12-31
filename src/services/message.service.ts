import { Injectable, NotFoundException } from '@nestjs/common';
import { InstanceService } from './instance.service';
import { SendTextDto } from 'src/controllers/message.controller';

@Injectable()
export class MessageService {
  constructor(private instanceService: InstanceService) {}

  async sendText(key: string, sendTextDto: SendTextDto): Promise<any> {
    const instance = this.instanceService.getInstance(key);

    if (!(await instance).instance.online) {
      throw new NotFoundException('Instance offline');
    }

    try {
      await (
        await instance
      ).sendTextMessage(sendTextDto.phone, sendTextDto.message);
    } catch (error) {
      throw new NotFoundException(error.message);
    }

    return {
      message: 'Text message sent successfully',
    };
  }

  async sendFile(
    key: string,
    phone: string,
    file: Express.Multer.File,
  ): Promise<any> {
    const instance = this.instanceService.getInstance(key);

    if (!(await instance).instance.online) {
      throw new NotFoundException('Instance offline');
    }

    console.log(file);

    try {
      await (await instance).sendMediaFile(phone, file, 'document', '', '');
    } catch (error) {
      throw new NotFoundException(error.message);
    }

    return {
      message: 'File sent successfully',
    };
  }
}
