import { AuthUserDto } from '@repo/api';
import { IssuedRefreshToken } from '../domain/token.service';

export interface AuthSessionResult {
  user: AuthUserDto;
  accessToken: string;
  refresh: IssuedRefreshToken;
}
