import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { isRoot } from '../../../common/constants/roles.constants';
import { JwtAccessPayload, Principal } from '../../../common/interfaces/authenticated-user.interface';
import { AppConfig } from '../../../config/configuration';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly workspaceCookie: string;

  constructor(
    config: ConfigService<AppConfig, true>,
    private readonly prisma: PrismaService,
  ) {
    const auth = config.get('auth', { infer: true });
    super({
      passReqToCallback: true,
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request?.cookies?.[auth.cookies.accessName] ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: auth.accessSecret,
    });
    this.workspaceCookie = auth.cookies.workspaceName;
  }

  /**
   * Re-reads the user on every request so deactivation, role changes and organization
   * suspension take effect immediately.
   */
  async validate(request: Request, payload: JwtAccessPayload): Promise<Principal> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        organizationId: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
        organization: { select: { isActive: true } },
      },
    });
    if (!user || !user.isActive || (user.organization && !user.organization.isActive)) {
      throw new UnauthorizedException();
    }
    const { isActive: _isActive, organization: _organization, ...principal } = user;
    if (isRoot(user.role)) {
      // The workspace cookie is honoured only for root, which may open any organization anyway.
      principal.organizationId = await this.rootWorkspace(request.cookies?.[this.workspaceCookie]);
    }
    return principal as Principal;
  }

  private async rootWorkspace(organizationId: unknown): Promise<string | null> {
    if (typeof organizationId !== 'string' || !organizationId) return null;
    const exists = await this.prisma.organization.count({ where: { id: organizationId } });
    return exists ? organizationId : null;
  }
}
