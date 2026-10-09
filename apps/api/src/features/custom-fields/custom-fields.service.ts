import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CustomField } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectAccessService } from '../projects/project-access.service';
import {
  CustomFieldType,
  MAX_CUSTOM_FIELDS,
  MAX_RATING,
  MAX_TAG_LENGTH,
  MAX_TAGS,
  MAX_TEXT_LENGTH,
} from './custom-field.constants';
import { CreateCustomFieldDto, CustomFieldOptionDto, UpdateCustomFieldDto } from './dto/custom-field.dto';

interface FieldOption {
  id: string;
  label: string;
  color: string;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class CustomFieldsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
  ) {}

  async findAll(user: AuthenticatedUser, projectId: string) {
    await this.access.assertCanView(user, projectId);
    const fields = await this.prisma.customField.findMany({ where: { projectId }, orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] });
    return fields.map((field) => this.present(field));
  }

  async create(user: AuthenticatedUser, projectId: string, dto: CreateCustomFieldDto) {
    await this.access.assertCanManageWritable(user, projectId);
    const count = await this.prisma.customField.count({ where: { projectId } });
    if (count >= MAX_CUSTOM_FIELDS) throw new BadRequestException(`A project can have at most ${MAX_CUSTOM_FIELDS} custom columns`);
    const options = dto.type === CustomFieldType.DROPDOWN ? this.normalizeOptions(dto.options ?? []) : null;
    if (dto.type === CustomFieldType.DROPDOWN && !options?.length) throw new BadRequestException('Add at least one choice to a dropdown column');
    const field = await this.prisma.customField.create({
      data: { projectId, name: dto.name, type: dto.type, options: options ? JSON.stringify(options) : null, position: count },
    });
    return this.present(field);
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateCustomFieldDto) {
    const field = await this.findManageable(user, id);
    let options: string | undefined;
    if (dto.options !== undefined) {
      if (field.type !== CustomFieldType.DROPDOWN) throw new BadRequestException('Only dropdown columns have choices');
      const normalized = this.normalizeOptions(dto.options);
      if (!normalized.length) throw new BadRequestException('A dropdown column needs at least one choice');
      options = JSON.stringify(normalized);
    }
    const updated = await this.prisma.customField.update({ where: { id }, data: { name: dto.name, position: dto.position, options } });
    return this.present(updated);
  }

  async remove(user: AuthenticatedUser, id: string): Promise<void> {
    await this.findManageable(user, id);
    await this.prisma.customField.delete({ where: { id } });
  }

  /** Sets (or with null, clears) a task's value in a column after checking it fits the column type. */
  async setValue(user: AuthenticatedUser, taskId: string, fieldId: string, raw: unknown) {
    const task = await this.prisma.task.findFirst({ where: { id: taskId, project: { organizationId: user.organizationId } }, select: { id: true, projectId: true } });
    if (!task) throw new NotFoundException('Task not found');
    await this.access.assertCanEdit(user, task.projectId);
    const field = await this.prisma.customField.findFirst({ where: { id: fieldId, projectId: task.projectId } });
    if (!field) throw new NotFoundException('Column not found in this project');

    const value = this.coerce(field, raw);
    if (value === null) {
      await this.prisma.customFieldValue.deleteMany({ where: { fieldId, taskId } });
      return { fieldId, value: null };
    }
    const json = JSON.stringify(value);
    await this.prisma.customFieldValue.upsert({
      where: { fieldId_taskId: { fieldId, taskId } },
      create: { fieldId, taskId, value: json },
      update: { value: json },
    });
    return { fieldId, value: json };
  }

  private coerce(field: CustomField, raw: unknown): unknown {
    if (raw === null || raw === undefined || raw === '') return null;
    const fail = (message: string): never => {
      throw new BadRequestException(`${field.name}: ${message}`);
    };
    switch (field.type) {
      case CustomFieldType.TEXT: {
        if (typeof raw !== 'string') return fail('expected text');
        const text = raw.trim();
        if (text.length > MAX_TEXT_LENGTH) return fail(`keep it under ${MAX_TEXT_LENGTH} characters`);
        return text || null;
      }
      case CustomFieldType.NUMBER: {
        const number = typeof raw === 'number' ? raw : Number(raw);
        if (!Number.isFinite(number)) return fail('expected a number');
        return number;
      }
      case CustomFieldType.CHECKBOX:
        if (typeof raw !== 'boolean') return fail('expected true or false');
        return raw ? true : null;
      case CustomFieldType.DATE: {
        // Round-tripping rejects impossible dates such as 2026-02-31.
        const parsed = typeof raw === 'string' && DATE_ONLY.test(raw) ? new Date(`${raw}T00:00:00Z`) : null;
        if (!parsed || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== raw) return fail('expected a date (YYYY-MM-DD)');
        return raw;
      }
      case CustomFieldType.LINK: {
        if (typeof raw !== 'string') return fail('expected a link');
        const link = raw.trim();
        try {
          const url = new URL(/^https?:\/\//i.test(link) ? link : `https://${link}`);
          if (!['http:', 'https:'].includes(url.protocol) || url.href.length > 2000) throw new Error();
          return url.href;
        } catch {
          return fail('expected a web address');
        }
      }
      case CustomFieldType.DROPDOWN: {
        const options = this.parseOptions(field);
        if (typeof raw !== 'string' || !options.some((o) => o.id === raw)) return fail('choose one of the column choices');
        return raw;
      }
      case CustomFieldType.TAGS: {
        const list = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(',') : fail('expected a list of tags');
        const tags = [...new Set(list.map((tag) => (typeof tag === 'string' ? tag.trim() : '')).filter(Boolean))];
        if (tags.length > MAX_TAGS) return fail(`at most ${MAX_TAGS} tags`);
        if (tags.some((tag) => tag.length > MAX_TAG_LENGTH)) return fail(`tags are at most ${MAX_TAG_LENGTH} characters`);
        return tags.length ? tags : null;
      }
      case CustomFieldType.RATING: {
        const rating = typeof raw === 'number' ? raw : Number(raw);
        if (!Number.isInteger(rating) || rating < 0 || rating > MAX_RATING) return fail(`expected 0 to ${MAX_RATING}`);
        return rating || null;
      }
      default:
        return fail('unsupported column type');
    }
  }

  private async findManageable(user: AuthenticatedUser, id: string): Promise<CustomField> {
    const field = await this.prisma.customField.findFirst({ where: { id, project: { organizationId: user.organizationId } } });
    if (!field) throw new NotFoundException('Column not found');
    await this.access.assertCanManageWritable(user, field.projectId);
    return field;
  }

  /** Keeps ids of existing choices (so values survive edits) and gives new ones an id. */
  private normalizeOptions(options: CustomFieldOptionDto[]): FieldOption[] {
    const seen = new Set<string>();
    return options.map((option) => {
      let id = option.id && !seen.has(option.id) ? option.id : randomBytes(5).toString('hex');
      while (seen.has(id)) id = randomBytes(5).toString('hex');
      seen.add(id);
      return { id, label: option.label, color: option.color };
    });
  }

  private parseOptions(field: CustomField): FieldOption[] {
    try {
      return field.options ? (JSON.parse(field.options) as FieldOption[]) : [];
    } catch {
      return [];
    }
  }

  private present(field: CustomField) {
    return { ...field, options: this.parseOptions(field) };
  }
}
