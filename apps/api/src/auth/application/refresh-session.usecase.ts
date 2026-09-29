import { Injectable } from '@nestjs/common';
import { UserRepository } from '../domain/user.repository';
import { SessionRepository } from '../domain/session.repository';
import { TokenService } from '../domain/token.service';
import { AuthSessionResult } from './auth-session.result';
import { InvalidRefreshSessionError } from '../domain/auth.exceptions';

@Injectable()
export class RefreshSessionUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(refreshToken?: string): Promise<AuthSessionResult> {
    if (!refreshToken) {
      throw new InvalidRefreshSessionError();
    }

    const current = await this.sessionRepository.findByRefreshTokenHash(
      this.tokenService.hashRefreshToken(refreshToken),
    );

    if (!current) {
      throw new InvalidRefreshSessionError();
    }

    const user = await this.userRepository.findById(current.userId);

    if (!user) {
      throw new InvalidRefreshSessionError();
    }

    const refresh = this.tokenService.issueRefreshToken();

    const rotated = current.rotate(refresh.hash, refresh.expiresAt);

    await this.sessionRepository.rotate(current, rotated);

    return {
      user: user.toDto(),
      accessToken: this.tokenService.issueAccessToken(user),
      refresh,
    };
  }
}
