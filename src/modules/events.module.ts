import { Module } from '@nestjs/common';
import { EventsGateway } from 'src/services/events.gateway';
import { Server } from 'socket.io';
import { MessageModule } from './message.module';

@Module({
  imports: [MessageModule],
  providers: [EventsGateway, Server],
  exports: [EventsGateway, Server],
})
export class EventsModule {}
