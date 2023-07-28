import { Controller } from '@nestjs/common';
import { AppService } from 'src/services/app.service';

@Controller('app')
export class AppController {
  constructor(private readonly appService: AppService) {}
}
