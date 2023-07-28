import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';

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
  init(@Request() req: any, @Body() sendTextDto: SendTextDto) {
    return this.messageService.sendText(req.user.key, sendTextDto);
  }
}
