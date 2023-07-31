import { Module } from '@nestjs/common';
import { AuthModule } from './auth.module';
import { InstanceModule } from './instance.module';
import { MessageModule } from './message.module';
import { ChatModule } from './chat.module';

@Module({
  imports: [AuthModule, InstanceModule, MessageModule, ChatModule],
})
export class AppModule {}
