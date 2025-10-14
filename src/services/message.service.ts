import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InstanceService } from './instance.service';

@Injectable()
export class MessageService {
  constructor(
    @Inject(forwardRef(() => InstanceService))
    private instanceService: InstanceService,
  ) {}

  async sendText(key: string, phone: string, message: string): Promise<any> {
    const instance = this.instanceService.getInstance(key);

    if (!(await instance).instance.online) {
      throw new NotFoundException('Instance offline');
    }

    try {
      await (await instance).sendTextMessage(phone, message);
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

  async sendImage(
    key: string,
    phone: string,
    file: Express.Multer.File,
    caption: string,
  ): Promise<any> {
    const instance = this.instanceService.getInstance(key);

    if (!(await instance).instance.online) {
      throw new NotFoundException('Instance offline');
    }

    try {
      await (await instance).sendMediaFile(phone, file, 'image', caption, null);
    } catch (error) {
      throw new NotFoundException(error.message);
    }

    return {
      message: 'Image sent successfully',
    };
  }

  async sendLocation(
    key: string,
    phone: string,
    latitude: number,
    longitude: number,
    locationName?: string,
    address?: string,
  ): Promise<any> {
    const instance = await this.instanceService.getInstance(key);

    if (!instance.instance.online) {
      throw new NotFoundException('Instance offline');
    }

    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);

    if (Number.isNaN(parsedLatitude) || Number.isNaN(parsedLongitude)) {
      throw new BadRequestException('Invalid latitude or longitude');
    }

    try {
      await instance.sendLocationMessage(
        phone,
        parsedLatitude,
        parsedLongitude,
        locationName,
        address,
      );
    } catch (error) {
      throw new NotFoundException(error.message);
    }

    return {
      message: 'Location sent successfully',
    };
  }
}
