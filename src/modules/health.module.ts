import { Module } from '@nestjs/common';
import { HealthController } from 'src/controllers/health.controller';
import { HealthService } from 'src/services/health.service';
import { PrismaService } from 'src/services/prisma.service';

@Module({
  controllers: [HealthController],
  providers: [HealthService, PrismaService],
})
export class HealthModule {}
