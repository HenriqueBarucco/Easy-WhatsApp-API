import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { InstanceModule } from 'src/instance/instance.module';
import { MessageModule } from 'src/message/message.module';

@Module({
  imports: [AuthModule, InstanceModule, MessageModule],
})
export class AppModule {}
