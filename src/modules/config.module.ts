import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppModule } from './app.module';
import { UsersModule } from './users.module';
import { AuthModule } from './auth.module';
import { InstanceModule } from './instance.module';
import { MessageModule } from './message.module';

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
