import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'node:crypto';
import { JwtAccessPayload, JwtRefreshPayload } from '../../common/interfaces/authenticated-user.interface';
import { AppConfig } from '../../config/configuration';
import { PrismaService } from '../../prisma/prisma.service';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface ClientMeta {
  userAgent?: string;
  ipAddress?: string;
}

interface TokenSubject {
  id: string;
  organizationId: string;
  role: string;
}

/** Issues short-lived access tokens and rotating, revocable refresh tokens. */
@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  private get auth() {
    return this.config.get('auth', { infer: true });
  }

  async issue(user: TokenSubject, meta: ClientMeta): Promise<TokenPair> {
    const jti = randomUUID();
    const accessPayload: JwtAccessPayload = { sub: user.id, org: user.organizationId, role: user.role };
    const refreshPayload: JwtRefreshPayload = { sub: user.id, jti };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(accessPayload, {
        secret: this.auth.accessSecret,
        expiresIn: Math.floor(this.auth.accessTtlMs / 1000),
      }),
      this.jwt.signAsync(refreshPayload, {
        secret: this.auth.refreshSecret,
        expiresIn: Math.floor(this.auth.refreshTtlMs / 1000),
      }),
    ]);

    await this.prisma.refreshToken.create({
      data: {
        id: jti,
        userId: user.id,
        tokenHash: this.hash(refreshToken),
        expiresAt: new Date(Date.now() + this.auth.refreshTtlMs),
        userAgent: meta.userAgent?.slice(0, 255),
        ipAddress: meta.ipAddress,
      },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Validates a refresh token and revokes it (rotation). Presenting an already
   * revoked token is treated as theft and revokes every session of that user.
   */
  async consume(refreshToken: string): Promise<string> {
    let payload: JwtRefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtRefreshPayload>(refreshToken, { secret: this.auth.refreshSecret });
    } catch {
      throw new UnauthorizedException('Session expired, please sign in again');
    }

    const stored = await this.prisma.refreshToken.findUnique({ where: { id: payload.jti } });
    if (!stored || stored.tokenHash !== this.hash(refreshToken) || stored.userId !== payload.sub) {
      throw new UnauthorizedException('Invalid session');
    }
    if (stored.revokedAt) {
      this.logger.warn(`Refresh token reuse detected for user ${stored.userId}; revoking all sessions`);
      await this.revokeAll(stored.userId);
      throw new UnauthorizedException('Session has been revoked');
    }
    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired, please sign in again');
    }

    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    return stored.userId;
  }

  async revoke(refreshToken: string): Promise<void> {
    const decoded = this.jwt.decode<JwtRefreshPayload | null>(refreshToken);
    if (decoded?.jti) {
      await this.prisma.refreshToken.updateMany({
        where: { id: decoded.jti, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  revokeAll(userId: string) {
    return this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
