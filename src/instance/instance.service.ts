import { Injectable } from '@nestjs/common';

@Injectable()
export class InstanceService {
  instances = [];

  async getInstance(key: string): Promise<any> {
    return this.instances.find((instance) => instance.key === key);
  }
}
