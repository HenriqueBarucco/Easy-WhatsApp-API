import { Module } from '@nestjs/common';
import { TokenController } from 'src/controllers/token.controller';
import { PrismaService } from 'src/services/prisma.service';
import { TokenService } from 'src/services/token.service';

@Module({
  controllers: [TokenController],
  providers: [TokenService, PrismaService],
})
export class TokenModule {}
