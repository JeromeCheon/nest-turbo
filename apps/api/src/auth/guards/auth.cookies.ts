import type { CookieOptions, Request, Response } from 'express';
import { AuthSessionResult } from '../application/auth-session.result';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

const BASE_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

export function setAuthCookies(
  response: Response,
  result: AuthSessionResult,
): void {
  const maxAge = result.refresh.expiresAt.getTime() - Date.now();

  response.cookie(ACCESS_TOKEN_COOKIE, result.accessToken, {
    ...BASE_COOKIE_OPTIONS,
    maxAge,
  });
  response.cookie(REFRESH_TOKEN_COOKIE, result.refresh.token, {
    ...BASE_COOKIE_OPTIONS,
    maxAge,
  });
}

export function clearAuthCookies(response: Response): void {
  response.clearCookie(ACCESS_TOKEN_COOKIE, BASE_COOKIE_OPTIONS);
  response.clearCookie(REFRESH_TOKEN_COOKIE, BASE_COOKIE_OPTIONS);
}

export function readRefreshToken(request: Request): string | undefined {
  return request.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
}
