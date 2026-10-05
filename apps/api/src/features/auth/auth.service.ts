import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrgRole } from '../../common/constants/roles.constants';
import { permissionsForRole } from '../../common/constants/permissions.constants';
import { PASSWORD_POLICY } from '../../common/validation/password.policy';
import { AppConfig } from '../../config/configuration';
import { PrismaService } from '../../prisma/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { PasswordService } from '../users/password.service';
import { USER_PUBLIC_SELECT } from '../users/users.select';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { ClientMeta, TokenPair, TokenService } from './token.service';

const DAY_MS = 86_400_000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly passwords: PasswordService,
    private readonly organizations: OrganizationsService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  /** Public, non-sensitive settings the sign-in screens need. */
  publicConfig() {
    const app = this.config.get('app', { infer: true });
    return {
      appName: app.name,
      allowPublicRegistration: app.allowPublicRegistration,
      rememberMeDays: Math.round(this.config.get('auth', { infer: true }).rememberTtlMs / DAY_MS),
      passwordPolicy: PASSWORD_POLICY,
    };
  }

  async register(dto: RegisterDto, meta: ClientMeta): Promise<TokenPair> {
    if (!this.config.get('app', { infer: true }).allowPublicRegistration) {
      throw new ForbiddenException('Self sign-up is disabled. Ask your administrator for an account.');
    }
    const email = dto.email.toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await this.passwords.hash(dto.password);
    const user = await this.prisma.$transaction(async (tx) => {
      const organization = await this.organizations.provision(tx, dto.organizationName);
      return tx.user.create({
        data: {
          organizationId: organization.id,
          email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: OrgRole.SUPER_ADMIN,
          passwordHash,
          lastLoginAt: new Date(),
        },
      });
    });

    return this.tokens.issue(user, meta);
  }

  async login(dto: LoginDto, meta: ClientMeta): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { organization: { select: { isActive: true } } },
    });
    const valid = user ? await this.passwords.verify(dto.password, user.passwordHash) : false;
    if (!user || !valid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.isActive) {
      throw new ForbiddenException('Your account has been deactivated');
    }
    if (user.organization && !user.organization.isActive) {
      throw new ForbiddenException('Your organization has been suspended. Contact the platform administrator.');
    }

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return this.tokens.issue(user, meta, dto.remember ?? false);
  }

  async refresh(refreshToken: string | undefined, meta: ClientMeta): Promise<TokenPair> {
    if (!refreshToken) throw new UnauthorizedException('No active session');
    const { userId, persistent } = await this.tokens.consume(refreshToken);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { organization: { select: { isActive: true } } },
    });
    if (!user || !user.isActive || (user.organization && !user.organization.isActive)) {
      throw new UnauthorizedException('No active session');
    }
    return this.tokens.issue(user, meta, persistent);
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (refreshToken) await this.tokens.revoke(refreshToken);
  }

  /** The signed-in account; for root, `organization` is the workspace it currently has open (or null). */
  async me(userId: string, organizationId: string | null) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: USER_PUBLIC_SELECT });
    const organization = organizationId ? await this.prisma.organization.findUnique({ where: { id: organizationId } }) : null;
    return { ...user, organization, permissions: permissionsForRole(user.role) };
  }
}
