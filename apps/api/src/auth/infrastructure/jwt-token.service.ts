import { Injectable } from '@nestjs/common';
import { IssuedRefreshToken, TokenService } from '../domain/token.service';
import { User } from '../domain/user.entity';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

const UNIT_MS = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };

function durationToMs(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());

  if (!match) {
    throw new Error(`지원하지 않는 TTL 형식입니다: ${value}`);
  }

  return Number(match[1]) * UNIT_MS[match[2] as keyof typeof UNIT_MS];
}

@Injectable()
export class JwtTokenService implements TokenService {
  private readonly accessTtl = process.env.ACCESS_TOKEN_TTL ?? '15m';
  private readonly refreshTtl = process.env.REFRESH_TOKEN_TTL ?? '7d';

  constructor(private readonly jwtService: JwtService) {}

  issueAccessToken(user: User): string {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email.value,
    };
    return this.jwtService.sign(payload, {
      expiresIn: durationToMs(this.accessTtl) / 1000,
    });
  }

  issueRefreshToken(): IssuedRefreshToken {
    const token = randomBytes(32).toString('hex');

    return {
      token,
      hash: this.hashRefreshToken(token),
      expiresAt: new Date(Date.now() + durationToMs(this.refreshTtl)),
    };
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
