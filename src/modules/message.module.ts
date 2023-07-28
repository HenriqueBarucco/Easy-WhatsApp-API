import { Module } from '@nestjs/common';
import { MessageController } from 'src/controllers/message.controller';
import { MessageService } from 'src/services/message.service';
import { InstanceModule } from './instance.module';
import { PrismaService } from 'src/services/prisma.service';

@Module({
  imports: [InstanceModule],
  controllers: [MessageController],
  providers: [MessageService, PrismaService],
})
export class MessageModule {}
