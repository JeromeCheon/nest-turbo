import { Injectable } from '@nestjs/common';
import { UserRepository } from '../domain/user.repository';
import { SessionRepository } from '../domain/session.repository';
import { TokenService } from '../domain/token.service';
import { PasswordHasher } from '../domain/password-hasher';
import { LoginDto } from '@repo/api';
import { Email } from '../domain/email.vo';
import { InvalidCredentialsError } from '../domain/auth.exceptions';
import { Session } from '../domain/session.entity';
import { AuthSessionResult } from './auth-session.result';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async execute(dto: LoginDto, userAgent?: string): Promise<AuthSessionResult> {
    const email = Email.create(dto.email);
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    if (!(await user.verifyPassword(dto.password, this.passwordHasher))) {
      throw new InvalidCredentialsError();
    }

    const refresh = this.tokenService.issueRefreshToken();

    const session = Session.issue({
      userId: user.id,
      refreshTokenHash: refresh.hash,
      expiresAt: refresh.expiresAt,
      userAgent,
    });

    await this.sessionRepository.create(session);

    return {
      user: user.toDto(),
      accessToken: this.tokenService.issueAccessToken(user),
      refresh,
    };
  }
}
