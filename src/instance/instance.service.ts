import { Injectable, NotFoundException } from '@nestjs/common';
import { WhatsAppInstance } from 'src/class/WhatsAppInstance';

@Injectable()
export class InstanceService {
  instances = [];

  getInstance(key: string): Promise<WhatsAppInstance | null> {
    return this.instances.find((instance) => instance.instance.key === key);
  }

  async init(key: string): Promise<any> {
    if (this.getInstance(key)) {
      return 'Instance already exists';
    }
    const instance = new WhatsAppInstance(key);
    const data = await instance.init();

    console.log('data', data);

    this.instances.push(data);
  }

  async qrbase64(key: string): Promise<any> {
    const instance = this.getInstance(key);

    if (!instance) {
      throw new NotFoundException('Instance not found');
    }

    let qrcode = (await instance).instance.qr;

    if (qrcode === '') {
      qrcode = (await (await instance).init()).instance.qr;
    }

    return {
      message: 'QR Base64 fetched successfully',
      qrcode,
    };
  }
}
