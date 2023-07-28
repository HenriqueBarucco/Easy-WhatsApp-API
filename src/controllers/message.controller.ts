import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { IsNotEmpty } from 'class-validator';
import { MessageService } from 'src/services/message.service';

export class SendTextDto {
  @ApiProperty()
  @IsNotEmpty()
  phone: string;

  @ApiProperty()
  @IsNotEmpty()
  message: string;
}

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Message')
@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @ApiOperation({ summary: 'Send text message' })
  @Post('text')
  sendTextPost(@Request() req: any, @Body() sendTextDto: SendTextDto) {
    return this.messageService.sendText(req.user.key, sendTextDto);
  }

  @ApiOperation({ summary: 'Send text message' })
  @Get('text/:phone/:message')
  sendTextGet(
    @Request() req: any,
    @Param('phone') phone: string,
    @Param('message') message: string,
  ) {
    const sendTextDto = {
      phone,
      message,
    };
    return this.messageService.sendText(req.user.key, sendTextDto);
  }

  @ApiOperation({ summary: 'TESTE' })
  @Post('teste')
  teste(@Request() req: any) {
    return this.messageService.teste(req.user.key);
  }
}
