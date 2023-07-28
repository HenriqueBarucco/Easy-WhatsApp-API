import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { InstanceService } from './instance.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Instance')
@Controller('instance')
export class InstanceController {
  constructor(private readonly instanceService: InstanceService) {}

  @ApiOperation({ summary: 'Init your instance' })
  @Get('init')
  init(@Request() req: any) {
    return this.instanceService.init(req.user);
  }

  @ApiOperation({ summary: 'Get QR Image as base64 string' })
  @Get('qrbase64')
  qrbase64(@Request() req: any) {
    return this.instanceService.qrbase64(req.user.key);
  }
}
