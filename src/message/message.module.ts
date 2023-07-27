import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { InstanceService } from 'src/instance/instance.service';

@Module({
  controllers: [MessageController],
  providers: [MessageService, InstanceService],
})
export class MessageModule {}
