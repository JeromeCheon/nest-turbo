import { User } from './user.entity';

export interface IssuedRefreshToken {
  token: string;
  hash: string;
  expiresAt: Date;
}

export abstract class TokenService {
  abstract issueAccessToken(user: User): string;
  abstract issueRefreshToken(): IssuedRefreshToken;
  abstract hashRefreshToken(token: string): string;
}
