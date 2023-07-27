import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { InstanceController } from 'src/instance/instance.controller';
import { AuthModule } from 'src/auth/auth.module';
import { InstanceModule } from 'src/instance/instance.module';
import { InstanceService } from 'src/instance/instance.service';

@Module({
  imports: [AuthModule, InstanceModule],
  controllers: [AppController, InstanceController],
  providers: [AppService, InstanceService],
})
export class AppModule {}
