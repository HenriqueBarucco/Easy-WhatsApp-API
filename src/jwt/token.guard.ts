import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from 'src/services/users.service';
import { JwtService } from '@nestjs/jwt';
import { ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';

@Injectable()
export class TokenAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const body = request.body;
    const bearer = request.headers.authorization?.split(' ')[1];

    if (!body.token && !bearer) {
      throw new UnauthorizedException('No token or Bearer token found');
    }

    if (!bearer) {
      const user = await this.usersService.userByToken(body.token);
      if (!user) {
        throw new UnauthorizedException('Your token is invalid');
      }
      request.user = user;
      return true;
    }

    let decodedToken: any;
    let user: User;
    try {
      decodedToken = this.jwtService.decode(bearer);
      user = await this.usersService.user(decodedToken.username);
    } catch (error) {
      throw new UnauthorizedException('Invalid JWT token');
    }

    request.user = user;
    return true;
  }
}
