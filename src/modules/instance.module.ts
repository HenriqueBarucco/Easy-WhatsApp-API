import { Module } from '@nestjs/common';
import { InstanceController } from 'src/controllers/instance.controller';
import { EventsGateway } from 'src/services/events.gateway';
import { InstanceService } from 'src/services/instance.service';
import { PrismaService } from 'src/services/prisma.service';
import { Server } from 'socket.io';
import { EventsModule } from './events.module';

@Module({
  imports: [EventsModule],
  controllers: [InstanceController],
  providers: [PrismaService, InstanceService],
  exports: [InstanceService],
})
export class InstanceModule {}
