import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser, JwtAccessPayload } from '../../../common/interfaces/authenticated-user.interface';
import { AppConfig } from '../../../config/configuration';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService<AppConfig, true>,
    private readonly prisma: PrismaService,
  ) {
    const auth = config.get('auth', { infer: true });
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request?.cookies?.[auth.cookies.accessName] ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: auth.accessSecret,
    });
  }

  /** Re-reads the user on every request so deactivation and role changes take effect immediately. */
  async validate(payload: JwtAccessPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, organizationId: true, role: true, firstName: true, lastName: true, isActive: true },
    });
    if (!user || !user.isActive || !user.organizationId) {
      throw new UnauthorizedException();
    }
    const { isActive: _isActive, organizationId, ...rest } = user;
    return { ...rest, organizationId };
  }
}
