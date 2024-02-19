import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { User } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class TokenService {
  constructor(private prisma: PrismaService) {}

  async current(user: User): Promise<any> {
    const currentUser = await this.prisma.user.findUnique({
      where: {
        id: user.id,
      },
    });

    return { token: currentUser.token };
  }

  async generate(user: User): Promise<any> {
    const updatedUser = await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        token: randomUUID(),
      },
    });

    return { token: updatedUser.token };
  }

  async delete(user: User): Promise<any> {
    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        token: null,
      },
    });

    return {
      message: 'Token deleted successfully',
    };
  }

  async getByKey(key: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        key: key,
      },
    });

    if (!user) {
      return null;
    }

    return user.token || null;
  }
}
