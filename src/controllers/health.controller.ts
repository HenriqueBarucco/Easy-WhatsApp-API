import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiProperty,
} from '@nestjs/swagger';
import { HealthService } from 'src/services/health.service';
import { getAppVersion } from 'src/utils/app-info';

class HealthAppDto {
  @ApiProperty({ example: 'up' })
  status: 'up';

  @ApiProperty({ example: 123 })
  uptimeSec: number;
}

class HealthDatabaseDto {
  @ApiProperty({ enum: ['up', 'down'], example: 'up' })
  status: 'up' | 'down';

  @ApiProperty({ example: 12.34, required: false })
  latencyMs?: number;

  @ApiProperty({ example: 'Connection refused', required: false })
  error?: string;
}

class HealthDetailsDto {
  @ApiProperty({ type: () => HealthAppDto })
  app: HealthAppDto;

  @ApiProperty({ type: () => HealthDatabaseDto })
  database: HealthDatabaseDto;
}

export class HealthResponseDto {
  @ApiProperty({ enum: ['ok', 'error'], example: 'ok' })
  status: 'ok' | 'error';

  @ApiProperty({ example: '2025-10-27T10:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '1.0.0' })
  version: string;

  @ApiProperty({ type: () => HealthDetailsDto })
  details: HealthDetailsDto;
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Health check status' })
  @ApiOkResponse({ description: 'Service healthy', type: HealthResponseDto })
  @ApiServiceUnavailableResponse({
    description: 'Service unhealthy',
    type: HealthResponseDto,
  })
  async getHealth(): Promise<HealthResponseDto> {
    const health = await this.healthService.check();
    const payload: HealthResponseDto = {
      ...health,
      version: getAppVersion(),
    };

    if (health.status === 'error') {
      throw new ServiceUnavailableException(payload);
    }

    return payload;
  }
}
