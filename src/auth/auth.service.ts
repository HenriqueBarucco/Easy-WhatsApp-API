import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { SignUpDto } from './auth.controller';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(username: string, pass: string): Promise<any> {
    const user = await this.usersService.user(username);

    if (!user || !(await bcrypt.compare(pass, user?.password))) {
      throw new UnauthorizedException();
    }

    const payload = { sub: user.id, username: user.username };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async signUp(signUpDto: SignUpDto): Promise<User> {
    const user = await this.usersService.user(signUpDto.username);
    if (user) {
      throw new ConflictException();
    }
    const newUser = await this.usersService.createUser({
      username: signUpDto.username,
      password: await bcrypt.hash(signUpDto.password, 10),
      name: signUpDto.name,
      email: signUpDto.email,
    });
    return newUser;
  }
}
