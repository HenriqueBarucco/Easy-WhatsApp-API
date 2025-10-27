import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from 'src/services/health.service';
import { version } from '../../package.json';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async getHealth() {
    const health = await this.healthService.check();

    if (health.status === 'error') {
      throw new ServiceUnavailableException({
        ...health,
        version,
      });
    }

    return {
      ...health,
      version,
    };
  }
}
