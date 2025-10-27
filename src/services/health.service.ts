import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { performance } from 'node:perf_hooks';

interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  details: {
    app: {
      status: 'up';
      uptimeSec: number;
    };
    database: {
      status: 'up' | 'down';
      latencyMs?: number;
      error?: string;
    };
  };
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthStatus> {
    const appHealth: HealthStatus['details']['app'] = {
      status: 'up',
      uptimeSec: Math.round(process.uptime()),
    };

    const databaseHealth: HealthStatus['details']['database'] = {
      status: 'up',
    };

    let overallStatus: HealthStatus['status'] = 'ok';

    try {
      const startedAt = performance.now();
      await this.prisma.$queryRaw`SELECT 1`;
      databaseHealth.latencyMs = Number(
        (performance.now() - startedAt).toFixed(2),
      );
    } catch (error) {
      databaseHealth.status = 'down';
      databaseHealth.error =
        error instanceof Error ? error.message : 'Unknown error';
      overallStatus = 'error';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      details: {
        app: appHealth,
        database: databaseHealth,
      },
    };
  }
}
