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
  ApiHeader,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { SanitizedUser, UserRequest } from 'src/decorators/user.decorator';
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

export class SendFileDto {
  @ApiProperty({ example: 'Phone Number - 5516990000000' })
  phone: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'File to upload',
  })
  file: string;
}

export class SendImageDto {
  @ApiProperty({ example: 'Phone Number - 5516990000000' })
  phone: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Image to upload',
  })
  file: string;

  @ApiProperty({ example: 'Caption for the image', required: false })
  @IsOptional()
  caption: string;
}

export class SendLocationDto {
  @ApiProperty({ example: 'Opcional' })
  @IsUUID()
  @IsOptional()
  token: string;

  @ApiProperty({ example: 'Phone Number - 5516990000000' })
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '-23.55052', description: 'Latitude in degrees' })
  @IsNotEmpty()
  @IsNumberString()
  latitude: string;

  @ApiProperty({ example: '-46.633308', description: 'Longitude in degrees' })
  @IsNotEmpty()
  @IsNumberString()
  longitude: string;

  @ApiProperty({
    example: 'Avenida Paulista',
    required: false,
    description: 'Friendly name for the location',
  })
  @IsOptional()
  @IsString()
  locationName?: string;

  @ApiProperty({
    example: 'São Paulo - SP',
    required: false,
    description: 'Additional location details',
  })
  @IsOptional()
  @IsString()
  address?: string;
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
    return this.messageService.sendText(
      req.user.key,
      sendTextDto.phone,
      sendTextDto.message,
    );
  }

  @ApiOperation({ summary: 'Send file' })
  @ApiConsumes('multipart/form-data')
  @ApiHeader({
    name: 'Token',
    description: 'Your personal token (optional)',
    required: false,
  })
  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  sendFile(
    @UserRequest() user: SanitizedUser,
    @UploadedFile() file: Express.Multer.File,
    @Body() sendFileDto: SendFileDto,
  ) {
    return this.messageService.sendFile(user.key, sendFileDto.phone, file);
  }

  @ApiOperation({ summary: 'Send image' })
  @ApiConsumes('multipart/form-data')
  @ApiHeader({
    name: 'Token',
    description: 'Your personal token (optional)',
    required: false,
  })
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 1024 * 1024 * 50, // 50MB
      },
    }),
  )
  sendImage(
    @UserRequest() user: SanitizedUser,
    @UploadedFile() file: Express.Multer.File,
    @Body() sendImageDto: SendImageDto,
  ) {
    return this.messageService.sendImage(
      user.key,
      sendImageDto.phone,
      file,
      sendImageDto.caption,
    );
  }

  @ApiOperation({ summary: 'Send location message' })
  @Post('location')
  sendLocation(
    @UserRequest() user: SanitizedUser,
    @Body() sendLocationDto: SendLocationDto,
  ) {
    return this.messageService.sendLocation(
      user.key,
      sendLocationDto.phone,
      Number(sendLocationDto.latitude),
      Number(sendLocationDto.longitude),
      sendLocationDto.locationName,
      sendLocationDto.address,
    );
  }
}
