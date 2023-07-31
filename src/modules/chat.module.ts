import { Module } from '@nestjs/common';
import { InstanceModule } from './instance.module';
import { ChatController } from 'src/controllers/chat.controller';
import { ChatService } from 'src/services/chat.service';
import { PrismaService } from 'src/services/prisma.service';

@Module({
  imports: [InstanceModule],
  controllers: [ChatController],
  providers: [ChatService, PrismaService],
})
export class ChatModule {}
