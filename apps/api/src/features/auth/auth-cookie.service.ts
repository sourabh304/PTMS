import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';
import { AppConfig } from '../../config/configuration';
import { TokenPair } from './token.service';

@Injectable()
export class AuthCookieService {
  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  private get auth() {
    return this.config.get('auth', { infer: true });
  }

  private baseOptions(): CookieOptions {
    const { cookies } = this.auth;
    return {
      httpOnly: true,
      secure: cookies.secure,
      sameSite: cookies.sameSite,
      domain: cookies.domain,
      path: '/',
    };
  }

  /** Non-persistent sessions use browser-session cookies that end when the browser closes. */
  set(response: Response, tokens: TokenPair): void {
    const { cookies, accessTtlMs } = this.auth;
    const lifetime = (maxAge: number) => (tokens.persistent ? { maxAge } : {});
    response.cookie(cookies.accessName, tokens.accessToken, { ...this.baseOptions(), ...lifetime(accessTtlMs) });
    response.cookie(cookies.refreshName, tokens.refreshToken, { ...this.baseOptions(), ...lifetime(tokens.refreshTtlMs) });
  }

  clear(response: Response): void {
    const { cookies } = this.auth;
    response.clearCookie(cookies.accessName, this.baseOptions());
    response.clearCookie(cookies.refreshName, this.baseOptions());
  }

  readRefreshToken(request: Request): string | undefined {
    return request.cookies?.[this.auth.cookies.refreshName];
  }

  readAccessToken(request: Request): string | undefined {
    return request.cookies?.[this.auth.cookies.accessName];
  }
}
