import { Module } from '@nestjs/common';
import { EventsGateway } from 'src/services/events.gateway';
import { Server } from 'socket.io';

@Module({
  providers: [EventsGateway, Server],
  exports: [EventsGateway, Server],
})
export class EventsModule {}
