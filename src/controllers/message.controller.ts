import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { TokenAuthGuard } from 'src/jwt/token.guard';
import { MessageService } from 'src/services/message.service';

export class SendTextDto {
  @ApiProperty({ example: 'Opcional' })
  @IsUUID()
  @IsOptional()
  token: string;

  @ApiProperty({ example: 'Phone Number - 5516990000000' })
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'Message to send' })
  @IsNotEmpty()
  message: string;
}

@ApiBearerAuth()
@UseGuards(TokenAuthGuard)
@ApiTags('Message')
@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @ApiOperation({ summary: 'Send text message' })
  @Post('text')
  sendTextPost(@Request() req: any, @Body() sendTextDto: SendTextDto) {
    return this.messageService.sendText(req.user.key, sendTextDto);
  }

  @ApiOperation({ summary: 'TESTE', deprecated: true })
  @Post('teste')
  teste(@Request() req: any) {
    return this.messageService.teste(req.user.key);
  }
}
