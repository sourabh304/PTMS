import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Plan } from '@prisma/client';
import { AppConfig } from '../../config/configuration';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';

@Injectable()
export class PlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  findAll(includeInactive = false) {
    return this.prisma.plan.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: { _count: { select: { subscriptions: true } } },
      orderBy: [{ isActive: 'desc' }, { priceCents: 'asc' }],
    });
  }

  async findOne(id: string): Promise<Plan> {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  create(dto: CreatePlanDto) {
    return this.prisma.plan.create({
      data: {
        ...dto,
        description: dto.description ?? null,
        currency: dto.currency ?? this.config.get('billing', { infer: true }).defaultCurrency,
        maxUsers: dto.maxUsers ?? null,
        maxProjects: dto.maxProjects ?? null,
      },
    });
  }

  async update(id: string, dto: UpdatePlanDto) {
    await this.findOne(id);
    return this.prisma.plan.update({ where: { id }, data: dto });
  }

  /** Plans with subscription history are kept for auditability; deactivate them instead. */
  async remove(id: string): Promise<void> {
    await this.findOne(id);
    const subscriptions = await this.prisma.subscription.count({ where: { planId: id } });
    if (subscriptions > 0) {
      throw new ConflictException(`This plan is used by ${subscriptions} subscription(s). Deactivate it instead of deleting.`);
    }
    await this.prisma.plan.delete({ where: { id } });
  }
}
