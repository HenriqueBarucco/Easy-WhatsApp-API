import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from 'src/services/chat.service';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @ApiOperation({ summary: 'Get QR Image as base64 string' })
  @Get()
  chat(@Request() req: any) {
    return this.chatService.chat(req.user.key);
  }

  @ApiOperation({ summary: 'Get your recent contacts' })
  @Get('contacts')
  contactsRecent(@Request() req: any) {
    return this.chatService.contactsRecent(req.user.key);
  }

  @ApiOperation({ summary: 'Get picture from a contact' })
  @Get('picture/:phone')
  contactPicture(@Request() req: any, @Query('phone') phone: string) {
    return this.chatService.contactPicture(req.user.key, phone);
  }
}
