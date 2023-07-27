import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InstanceModule } from './instance/instance.module';
import { AppModule } from './app/app.module';
import { MessageModule } from './message/message.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AppModule,
    UsersModule,
    InstanceModule,
    MessageModule,
  ],
})
export class AppConfigModule {}
