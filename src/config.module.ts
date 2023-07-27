import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InstanceModule } from './instance/instance.module';
import { AppModule } from './app/app.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    InstanceModule,
    AppModule,
  ],
})
export class AppConfigModule {}
