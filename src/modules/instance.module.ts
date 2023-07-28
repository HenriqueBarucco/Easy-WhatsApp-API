import { Module } from '@nestjs/common';
import { InstanceController } from 'src/controllers/instance.controller';
import { InstanceService } from 'src/services/instance.service';
import { PrismaService } from 'src/services/prisma.service';

@Module({
  controllers: [InstanceController],
  providers: [PrismaService, InstanceService],
  exports: [InstanceService],
})
export class InstanceModule {}
