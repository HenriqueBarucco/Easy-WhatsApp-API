import { Module } from '@nestjs/common';
import { EventsGateway } from 'src/services/events.gateway';
import { MessageModule } from './message.module';

@Module({
  imports: [MessageModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
