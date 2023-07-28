import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InstanceModule } from './instance/instance.module';
import { AppModule } from './app/app.module';
import { MessageModule } from './message/message.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AppModule,
    UsersModule,
    AuthModule,
    InstanceModule,
    MessageModule,
  ],
})
export class AppConfigModule {}
