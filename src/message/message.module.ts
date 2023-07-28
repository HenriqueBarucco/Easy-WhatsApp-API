import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { PrismaService } from 'src/prisma.service';
import { InstanceModule } from 'src/instance/instance.module';

@Module({
  imports: [InstanceModule],
  controllers: [MessageController],
  providers: [MessageService, PrismaService],
})
export class MessageModule {}
