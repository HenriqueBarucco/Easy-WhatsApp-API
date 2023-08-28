import {
  Body,
  Controller,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { TokenAuthGuard } from 'src/jwt/token.guard';
import { MessageService } from 'src/services/message.service';
import { MulterFile } from 'multer';

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
  sendText(@Request() req: any, @Body() sendTextDto: SendTextDto) {
    return this.messageService.sendText(req.user.key, sendTextDto);
  }

  @ApiOperation({ summary: 'Send file' })
  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  sendFile(@Request() req: any, @UploadedFile() file: MulterFile) {
    const formData: FormData = req.body as FormData;

    const phone: string = formData['phone'] as string;

    return this.messageService.sendFile(req.user.key, phone, file);
  }
}
