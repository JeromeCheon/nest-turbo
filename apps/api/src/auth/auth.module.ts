import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtSecret, JwtStrategy } from './guards/jwt.strategy';
import { GetMeUseCase } from './application/get-me.usecase';
import { LoginUseCase } from './application/login.usecase';
import { LogoutUseCase } from './application/logout.usecase';
import { RefreshSessionUseCase } from './application/refresh-session.usecase';
import { RegisterUserUseCase } from './application/register-user.usecase';
import { PasswordHasher } from './domain/password-hasher';
import { RobotSeeder } from './domain/robot-seeder';
import { SessionRepository } from './domain/session.repository';
import { TokenService } from './domain/token.service';
import { UserRepository } from './domain/user.repository';
import { BcryptPasswordHasher } from './infrastructure/bcrypt-password-hasher';
import { JwtTokenService } from './infrastructure/jwt-token.service';
import { PrismaRobotSeeder } from './infrastructure/prisma-robot-seeder';
import { PrismaSessionRepository } from './infrastructure/prisma-session.repository';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({ secret: jwtSecret() }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    RegisterUserUseCase,
    LoginUseCase,
    RefreshSessionUseCase,
    LogoutUseCase,
    GetMeUseCase,
    JwtStrategy,
    { provide: UserRepository, useClass: PrismaUserRepository },
    { provide: SessionRepository, useClass: PrismaSessionRepository },
    { provide: PasswordHasher, useClass: BcryptPasswordHasher },
    { provide: TokenService, useClass: JwtTokenService },
    { provide: RobotSeeder, useClass: PrismaRobotSeeder },
  ],
})
export class AuthModule {}
