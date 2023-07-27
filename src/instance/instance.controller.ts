import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { InstanceService } from './instance.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Instance')
@Controller('instance')
export class InstanceController {
  constructor(private readonly instanceService: InstanceService) {}

  @Get('/')
  getInstance(@Request() req: any) {
    return this.instanceService.getInstance(req.user.key);
  }
}
