import {
  Controller,
  Delete,
  Get,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { TokenService } from 'src/services/token.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Token')
@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @ApiOperation({ summary: 'Get current token' })
  @Get()
  current(@Request() req: any) {
    return this.tokenService.current(req.user);
  }

  @ApiOperation({ summary: 'Generate a new token' })
  @Put()
  generate(@Request() req: any) {
    return this.tokenService.generate(req.user);
  }

  @ApiOperation({ summary: 'Delete the token' })
  @Delete()
  delete(@Request() req: any) {
    return this.tokenService.delete(req.user);
  }
}
