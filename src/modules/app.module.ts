import { Module } from '@nestjs/common';
import { AuthModule } from './auth.module';
import { InstanceModule } from './instance.module';
import { MessageModule } from './message.module';
import { ChatModule } from './chat.module';
import { TokenModule } from './token.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    AuthModule,
    InstanceModule,
    MessageModule,
    ChatModule,
    TokenModule,
    ConfigModule.forRoot(),
  ],
})
export class AppModule {}
