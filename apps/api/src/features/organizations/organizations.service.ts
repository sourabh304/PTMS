import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Organization, Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { slugify } from '../../common/utils/string.util';
import { PrismaService } from '../../prisma/prisma.service';
import { LookupsService } from '../lookups/lookups.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { ORGANIZATION_DEFAULTS } from './organization.defaults';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lookups: LookupsService,
  ) {}

  /** Creates an organization with its default workflow inside the given transaction. */
  async provision(tx: Prisma.TransactionClient, name: string): Promise<Organization> {
    const organization = await tx.organization.create({
      data: { name, slug: await this.uniqueSlug(tx, name), ...ORGANIZATION_DEFAULTS },
    });
    await this.lookups.seedDefaults(organization.id, tx);
    return organization;
  }

  async findById(id: string): Promise<Organization> {
    const organization = await this.prisma.organization.findUnique({ where: { id } });
    if (!organization) throw new NotFoundException('Organization not found');
    return organization;
  }

  update(id: string, dto: UpdateOrganizationDto): Promise<Organization> {
    if (dto.timezone && !this.isValidTimezone(dto.timezone)) {
      throw new BadRequestException('Unknown timezone');
    }
    return this.prisma.organization.update({ where: { id }, data: dto });
  }

  private isValidTimezone(timezone: string): boolean {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }

  private async uniqueSlug(tx: Prisma.TransactionClient, name: string): Promise<string> {
    const base = slugify(name) || 'workspace';
    const taken = await tx.organization.findUnique({ where: { slug: base } });
    return taken ? `${base}-${randomBytes(3).toString('hex')}` : base;
  }
}
