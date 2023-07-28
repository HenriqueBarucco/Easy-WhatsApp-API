import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { WhatsAppInstance } from 'src/class/WhatsAppInstance';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class InstanceService {
  constructor(private prisma: PrismaService) {}
  instances = [];

  getInstance(key: string): Promise<WhatsAppInstance | null> {
    const instance = this.instances.find(
      (instance) => instance.instance.key === key,
    );
    return instance;
  }

  async restoreSessions(): Promise<void> {
    const instances = await this.prisma.instance.findMany();
    const promises = [];

    instances.forEach((instance) => {
      const restoreSessions = new WhatsAppInstance(instance.id);
      const initPromise = restoreSessions.init();
      promises.push(initPromise);
    });

    const initializedInstances = await Promise.all(promises);

    this.instances.push(...initializedInstances);
  }

  async init(user: User): Promise<any> {
    if (this.getInstance(user.key)) {
      return 'Instance already exists';
    }
    const alreadyThere = await this.prisma.instance.findUnique({
      where: { id: user.key },
    });
    if (!alreadyThere) {
      await this.prisma.instance.create({
        data: {
          id: user.key,
          ownerId: user.id,
        },
      });
    }
    const instance = new WhatsAppInstance(user.key);
    const data = await instance.init();

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
