import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { UsersService } from './users.service';
import { SignUpDto } from 'src/controllers/auth.controller';
import { InstanceService } from './instance.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private instanceService: InstanceService,
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
      key: user.key,
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

    await this.instanceService.createInstance(newUser);

    return newUser;
  }
}
