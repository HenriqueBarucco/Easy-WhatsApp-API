import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';
import { omit } from 'lodash';

export type SanitizedUser = Omit<User, 'password' | 'token'>;

export const UserRequest = createParamDecorator(
  <T extends User = User>(data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as T;

    const sanitizedUser: SanitizedUser = omit(user, ['password', 'token']);

    return sanitizedUser;
  },
);
