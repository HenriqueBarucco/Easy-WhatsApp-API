import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { InstanceController } from 'src/instance/instance.controller';
import { AuthModule } from 'src/auth/auth.module';
import { InstanceModule } from 'src/instance/instance.module';
import { InstanceService } from 'src/instance/instance.service';
import { MessageService } from 'src/message/message.service';
import { MessageController } from 'src/message/message.controller';
import { MessageModule } from 'src/message/message.module';
import { PrismaService } from 'src/prisma.service';

@Module({
  imports: [AuthModule, InstanceModule, MessageModule],
  controllers: [AppController, InstanceController, MessageController],
  providers: [AppService, InstanceService, MessageService, PrismaService],
})
export class AppModule {}
