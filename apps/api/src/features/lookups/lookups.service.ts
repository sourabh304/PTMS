import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Lookup, Prisma } from '@prisma/client';
import {
  LookupType,
  STATUS_LOOKUP_TYPES,
  StatusCategory,
} from '../../common/constants/domain.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLookupDto, ReorderLookupsDto, UpdateLookupDto } from './dto/lookup.dto';
import { DEFAULT_LOOKUPS } from './lookup.defaults';

type Tx = Prisma.TransactionClient;

@Injectable()
export class LookupsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Provisions the starter workflow for a brand new organization. */
  async seedDefaults(organizationId: string, tx: Tx = this.prisma): Promise<void> {
    const positions = new Map<string, number>();
    await tx.lookup.createMany({
      data: DEFAULT_LOOKUPS.map((seed) => {
        const position = positions.get(seed.type) ?? 0;
        positions.set(seed.type, position + 1);
        return {
          organizationId,
          type: seed.type,
          name: seed.name,
          color: seed.color,
          category: seed.category ?? null,
          isDefault: seed.isDefault ?? false,
          position,
        };
      }),
    });
  }

  findAll(organizationId: string, type?: LookupType): Promise<Lookup[]> {
    return this.prisma.lookup.findMany({
      where: { organizationId, ...(type ? { type } : {}) },
      orderBy: [{ type: 'asc' }, { position: 'asc' }],
    });
  }

  async create(organizationId: string, dto: CreateLookupDto): Promise<Lookup> {
    this.assertCategory(dto.type, dto.category);
    const last = await this.prisma.lookup.findFirst({
      where: { organizationId, type: dto.type },
      orderBy: { position: 'desc' },
    });

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) await this.clearDefault(tx, organizationId, dto.type);
      return tx.lookup.create({
        data: {
          organizationId,
          type: dto.type,
          name: dto.name,
          color: dto.color,
          category: this.isStatusType(dto.type) ? dto.category : null,
          isDefault: dto.isDefault ?? false,
          position: (last?.position ?? -1) + 1,
        },
      });
    });
  }

  async update(organizationId: string, id: string, dto: UpdateLookupDto): Promise<Lookup> {
    const existing = await this.findOwned(organizationId, id);
    if (dto.category !== undefined) this.assertCategory(existing.type as LookupType, dto.category);
    if (dto.isDefault === false && existing.isDefault) {
      throw new BadRequestException('Mark another value as default instead of unsetting the current default');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) await this.clearDefault(tx, organizationId, existing.type);
      return tx.lookup.update({ where: { id }, data: dto });
    });
  }

  async reorder(organizationId: string, dto: ReorderLookupsDto): Promise<Lookup[]> {
    const owned = await this.prisma.lookup.count({
      where: { organizationId, type: dto.type, id: { in: dto.ids } },
    });
    if (owned !== dto.ids.length) {
      throw new BadRequestException('Reorder list contains unknown values');
    }
    await this.prisma.$transaction(
      dto.ids.map((id, position) => this.prisma.lookup.update({ where: { id }, data: { position } })),
    );
    return this.findAll(organizationId, dto.type);
  }

  async remove(organizationId: string, id: string, replacementId?: string): Promise<void> {
    const existing = await this.findOwned(organizationId, id);
    const type = existing.type as LookupType;
    const siblings = await this.prisma.lookup.count({ where: { organizationId, type } });
    if (siblings <= 1) {
      throw new BadRequestException('At least one value of each type must remain');
    }

    const usage = await this.countUsage(id, type);
    let replacement: Lookup | null = null;
    if (usage > 0 || existing.isDefault) {
      if (!replacementId || replacementId === id) {
        throw new BadRequestException(
          `This value is in use (${usage} records) or is the default. Provide a replacementId.`,
        );
      }
      replacement = await this.findOwned(organizationId, replacementId);
      if (replacement.type !== type) {
        throw new BadRequestException('Replacement must be of the same type');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      if (replacement) {
        await this.reassign(tx, type, id, replacement.id);
        if (existing.isDefault) {
          await tx.lookup.update({ where: { id: replacement.id }, data: { isDefault: true } });
        }
      }
      await tx.lookup.delete({ where: { id } });
    });
  }

  // ─── Helpers used by other features ──────────────────────────

  async getDefaultId(organizationId: string, type: LookupType): Promise<string> {
    const lookup =
      (await this.prisma.lookup.findFirst({ where: { organizationId, type, isDefault: true } })) ??
      (await this.prisma.lookup.findFirst({ where: { organizationId, type }, orderBy: { position: 'asc' } }));
    if (!lookup) {
      throw new BadRequestException(`No ${type} values configured for this organization`);
    }
    return lookup.id;
  }

  /** Ensures a lookup id belongs to the organization and has the expected type. */
  async assertValid(organizationId: string, id: string, type: LookupType): Promise<Lookup> {
    const lookup = await this.prisma.lookup.findFirst({ where: { id, organizationId, type } });
    if (!lookup) {
      throw new BadRequestException(`Invalid ${type.toLowerCase().replace('_', ' ')}`);
    }
    return lookup;
  }

  async idsByCategory(organizationId: string, type: LookupType, category: StatusCategory): Promise<string[]> {
    const rows = await this.prisma.lookup.findMany({
      where: { organizationId, type, category },
      select: { id: true },
    });
    return rows.map((row) => row.id);
  }

  async categoryMap(organizationId: string, type: LookupType): Promise<Map<string, string | null>> {
    const rows = await this.prisma.lookup.findMany({
      where: { organizationId, type },
      select: { id: true, category: true },
    });
    return new Map(rows.map((row) => [row.id, row.category]));
  }

  // ─── Private ─────────────────────────────────────────────────

  private async findOwned(organizationId: string, id: string): Promise<Lookup> {
    const lookup = await this.prisma.lookup.findFirst({ where: { id, organizationId } });
    if (!lookup) throw new NotFoundException('Value not found');
    return lookup;
  }

  private isStatusType(type: LookupType): boolean {
    return STATUS_LOOKUP_TYPES.includes(type);
  }

  private assertCategory(type: LookupType, category?: StatusCategory | null): void {
    if (this.isStatusType(type) && !category) {
      throw new BadRequestException('Status values require a category');
    }
  }

  private clearDefault(tx: Tx, organizationId: string, type: string) {
    return tx.lookup.updateMany({ where: { organizationId, type, isDefault: true }, data: { isDefault: false } });
  }

  private async countUsage(id: string, type: LookupType): Promise<number> {
    switch (type) {
      case LookupType.PROJECT_STATUS:
        return this.prisma.project.count({ where: { statusId: id } });
      case LookupType.TASK_STATUS:
        return this.prisma.task.count({ where: { statusId: id } });
      case LookupType.ISSUE_STATUS:
        return this.prisma.issue.count({ where: { statusId: id } });
      case LookupType.ISSUE_SEVERITY:
        return this.prisma.issue.count({ where: { severityId: id } });
      case LookupType.PRIORITY: {
        const [tasks, issues] = await Promise.all([
          this.prisma.task.count({ where: { priorityId: id } }),
          this.prisma.issue.count({ where: { priorityId: id } }),
        ]);
        return tasks + issues;
      }
    }
  }

  private async reassign(tx: Tx, type: LookupType, fromId: string, toId: string): Promise<void> {
    switch (type) {
      case LookupType.PROJECT_STATUS:
        await tx.project.updateMany({ where: { statusId: fromId }, data: { statusId: toId } });
        break;
      case LookupType.TASK_STATUS:
        await tx.task.updateMany({ where: { statusId: fromId }, data: { statusId: toId } });
        break;
      case LookupType.ISSUE_STATUS:
        await tx.issue.updateMany({ where: { statusId: fromId }, data: { statusId: toId } });
        break;
      case LookupType.ISSUE_SEVERITY:
        await tx.issue.updateMany({ where: { severityId: fromId }, data: { severityId: toId } });
        break;
      case LookupType.PRIORITY:
        await tx.task.updateMany({ where: { priorityId: fromId }, data: { priorityId: toId } });
        await tx.issue.updateMany({ where: { priorityId: fromId }, data: { priorityId: toId } });
        break;
    }
  }
}
