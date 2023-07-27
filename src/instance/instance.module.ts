import { Module } from '@nestjs/common';
import { InstanceService } from './instance.service';
import { InstanceController } from './instance.controller';

@Module({
  controllers: [InstanceController],
  providers: [InstanceService]
})
export class InstanceModule {}
