import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { configuration } from '../../config/configuration';
import { AuthCookieService } from './auth-cookie.service';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { ClientMeta } from './token.service';

/** Stricter rate limit for credential endpoints; resolved lazily at request time once env is loaded. */
const authThrottle = () =>
  Throttle({
    default: {
      limit: () => configuration().throttle.authLimit,
      ttl: () => configuration().throttle.ttlMs,
    },
  });

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookies: AuthCookieService,
  ) {}

  @Public()
  @Get('config')
  config() {
    return this.auth.publicConfig();
  }

  @Public()
  @authThrottle()
  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.auth.register(dto, this.meta(req));
    this.cookies.set(res, tokens);
    return { success: true };
  }

  @Public()
  @authThrottle()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.auth.login(dto, this.meta(req));
    this.cookies.set(res, tokens);
    return { success: true };
  }

  @Public()
  @authThrottle()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      const tokens = await this.auth.refresh(this.cookies.readRefreshToken(req), this.meta(req));
      this.cookies.set(res, tokens);
      return { success: true };
    } catch (error) {
      this.cookies.clear(res);
      throw error;
    }
  }

  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(this.cookies.readRefreshToken(req));
    this.cookies.clear(res);
  }

  @Get('me')
  me(@CurrentUser('id') userId: string) {
    return this.auth.me(userId);
  }

  private meta(req: Request): ClientMeta {
    return { userAgent: req.get('user-agent'), ipAddress: req.ip };
  }
}
