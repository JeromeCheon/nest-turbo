import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { RegisterUserUseCase } from './application/register-user.usecase';
import { RefreshSessionUseCase } from './application/refresh-session.usecase';
import { LoginUseCase } from './application/login.usecase';
import { LogoutUseCase } from './application/logout.usecase';
import { GetMeUseCase } from './application/get-me.usecase';
import { LoginRequest, RegisterRequest } from './dto/auth.request';
import { AuthUserDto } from '@repo/api';
import {
  clearAuthCookies,
  readRefreshToken,
  setAuthCookies,
} from './guards/auth.cookies';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../common/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly logoutUserUseCase: LogoutUseCase,
    private readonly getMeUseCase: GetMeUseCase,
  ) {}

  @Post('register')
  async registerUser(@Body() body: RegisterRequest): Promise<AuthUserDto> {
    return await this.registerUserUseCase.execute(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginUser(
    @Body() body: LoginRequest,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthUserDto> {
    const result = await this.loginUserUseCase.execute(
      body,
      request.headers['user-agent'],
    );

    setAuthCookies(response, result);
    return result.user;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshSession(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthUserDto> {
    const result = await this.refreshSessionUseCase.execute(
      readRefreshToken(request),
    );

    setAuthCookies(response, result);
    return result.user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<null> {
    await this.logoutUserUseCase.execute(readRefreshToken(request));

    clearAuthCookies(response);

    return null;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<AuthUserDto> {
    return this.getMeUseCase.execute(user.id);
  }
}
