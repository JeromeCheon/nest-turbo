import { Controller, Get, NotImplementedException } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Get('me')
  getMe(): never {
    throw new NotImplementedException();
  }
}
