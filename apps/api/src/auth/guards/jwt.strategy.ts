import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import type { AuthenticatedUser } from '../../common/current-user.decorator';
import type { AccessTokenPayload } from '../infrastructure/jwt-token.service';
import { ACCESS_TOKEN_COOKIE } from './auth.cookies';

export function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET이 설정되지 않았습니다 (apps/api/.env)');
  }

  return secret;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) =>
          (request.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined) ??
          null,
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret(),
    });
  }

  validate(payload: AccessTokenPayload): AuthenticatedUser {
    return { id: payload.sub, email: payload.email };
  }
}
