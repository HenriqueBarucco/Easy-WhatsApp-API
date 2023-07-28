import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { InstanceService } from 'src/services/instance.service';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Instance')
@Controller('instance')
export class InstanceController {
  constructor(private readonly instanceService: InstanceService) {}

  @ApiOperation({ summary: 'Get QR Image as base64 string' })
  @Get('qrbase64')
  qrbase64(@Request() req: any) {
    return this.instanceService.qrbase64(req.user.key);
  }

  @ApiOperation({ summary: 'Get instance info' })
  @Get('info')
  info(@Request() req: any) {
    return this.instanceService.info(req.user.key);
  }

  @ApiOperation({ summary: 'Disconnect instance' })
  @Get('disconnect')
  disconnect(@Request() req: any) {
    return this.instanceService.disconnect(req.user.key);
  }
}
