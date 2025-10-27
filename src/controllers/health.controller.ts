import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from 'src/services/health.service';
import { getAppVersion } from 'src/utils/app-info';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async getHealth() {
    const health = await this.healthService.check();

    if (health.status === 'error') {
      throw new ServiceUnavailableException({
        ...health,
        version: getAppVersion(),
      });
    }

    return {
      ...health,
      version: getAppVersion(),
    };
  }
}
