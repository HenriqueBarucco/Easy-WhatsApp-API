import { Module } from '@nestjs/common';
import { EventsGateway } from 'src/services/events.gateway';
import { MessageModule } from './message.module';
import { TokenModule } from './token.module';

@Module({
  imports: [MessageModule, TokenModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
