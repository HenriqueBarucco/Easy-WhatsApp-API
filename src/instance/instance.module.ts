import { Module } from '@nestjs/common';
import { InstanceService } from './instance.service';
import { InstanceController } from './instance.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [InstanceController],
  providers: [PrismaService, InstanceService],
})
export class InstanceModule {}
