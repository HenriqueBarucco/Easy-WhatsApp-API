import { Module, forwardRef } from '@nestjs/common';
import { MessageController } from 'src/controllers/message.controller';
import { MessageService } from 'src/services/message.service';
import { InstanceModule } from './instance.module';
import { PrismaService } from 'src/services/prisma.service';
import { UsersService } from 'src/services/users.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => InstanceModule),
  ],
  controllers: [MessageController],
  providers: [MessageService, PrismaService, UsersService, ConfigService],
  exports: [MessageService],
})
export class MessageModule {}
