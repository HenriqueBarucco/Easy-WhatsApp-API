import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppModule } from './modules/app.module';
import { UsersModule } from './modules/users.module';
import { AuthModule } from './modules/auth.module';
import { InstanceModule } from './modules/instance.module';
import { MessageModule } from './modules/message.module';

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
