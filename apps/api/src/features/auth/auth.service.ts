import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { permissionsForRole } from '../../common/constants/permissions.constants';
import { PASSWORD_POLICY } from '../../common/validation/password.policy';
import { AppConfig } from '../../config/configuration';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordService } from '../users/password.service';
import { USER_PUBLIC_SELECT } from '../users/users.select';
import { LoginDto } from './dto/auth.dto';
import { ClientMeta, TokenPair, TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly passwords: PasswordService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  /** Public, non-sensitive settings the sign-in screens need. */
  publicConfig() {
    const app = this.config.get('app', { infer: true });
    return {
      appName: app.name,
      passwordPolicy: PASSWORD_POLICY,
    };
  }

  async login(dto: LoginDto, meta: ClientMeta): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { organization: { select: { deletedAt: true } } },
    });
    const valid = user ? await this.passwords.verify(dto.password, user.passwordHash) : false;
    if (!user || !valid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.isActive) {
      throw new ForbiddenException('Your account has been deactivated');
    }
    if (user.organization.deletedAt) {
      throw new ForbiddenException('This workspace has been deleted. Contact the root administrator.');
    }

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return this.tokens.issue(user, meta);
  }

  async refresh(refreshToken: string | undefined, meta: ClientMeta): Promise<TokenPair> {
    if (!refreshToken) throw new UnauthorizedException('No active session');
    const userId = await this.tokens.consume(refreshToken);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { organization: { select: { deletedAt: true } } },
    });
    if (!user || !user.isActive || user.organization.deletedAt) {
      throw new UnauthorizedException('No active session');
    }
    return this.tokens.issue(user, meta);
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (refreshToken) await this.tokens.revoke(refreshToken);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { ...USER_PUBLIC_SELECT, organization: true },
    });
    return { ...user, permissions: permissionsForRole(user.role) };
  }
}
