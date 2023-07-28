import { Module } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma.service';
import { UsersService } from 'src/services/users.service';

@Module({
  providers: [PrismaService, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
