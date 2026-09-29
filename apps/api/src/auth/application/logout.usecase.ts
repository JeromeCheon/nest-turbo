import { Injectable } from '@nestjs/common';
import { TokenService } from '../domain/token.service';
import { SessionRepository } from '../domain/session.repository';

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }

    const session = await this.sessionRepository.findByRefreshTokenHash(
      this.tokenService.hashRefreshToken(refreshToken),
    );

    if (!session || !session.isActive()) {
      return;
    }

    session.revoke();

    await this.sessionRepository.save(session);
  }
}
