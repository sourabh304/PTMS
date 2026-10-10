import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MeetingsService } from './meetings.service';

/** Each meeting is announced once, so checking often only delivers the morning notice closer to its hour. */
const CHECK_INTERVAL_MS = 15 * 60 * 1000;
const FIRST_CHECK_DELAY_MS = 20_000;

/** Tells everyone who can see a meeting about it at the start of the day it takes place. */
@Injectable()
export class MeetingRemindersService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(MeetingRemindersService.name);
  private readonly timers: NodeJS.Timeout[] = [];
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly meetings: MeetingsService,
  ) {}

  onApplicationBootstrap(): void {
    // Serverless functions do not stay alive between requests; Vercel Cron calls run() instead.
    if (process.env.VERCEL) return;
    this.timers.push(setTimeout(() => void this.run(), FIRST_CHECK_DELAY_MS).unref());
    this.timers.push(setInterval(() => void this.run(), CHECK_INTERVAL_MS).unref());
  }

  onModuleDestroy(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
  }

  /** `digestHour` 0 announces every meeting of the day (used by the once-a-day cron). */
  async run(now = new Date(), digestHour?: number): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const organizations = await this.prisma.organization.findMany({ where: { isActive: true }, select: { id: true } });
      for (const organization of organizations) await this.meetings.sendReminders(organization.id, undefined, now, digestHour);
    } catch (error) {
      this.logger.warn(`Could not send meeting reminders: ${(error as Error).message}`);
    } finally {
      this.running = false;
    }
  }
}
