import { Module } from '@nestjs/common';
import { AuthModule } from './auth.module';
import { InstanceModule } from './instance.module';
import { MessageModule } from './message.module';

@Module({
  imports: [AuthModule, InstanceModule, MessageModule],
})
export class AppModule {}
