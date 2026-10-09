import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { NotificationType } from '../../common/constants/domain.constants';
import { NotificationLinks } from '../../common/events/domain-events';
import { EventPublisher } from '../../common/events/event-publisher.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { addDays, todayInTimezone } from '../../common/utils/date.util';
import { AppConfig } from '../../config/configuration';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectAccessService } from '../projects/project-access.service';
import { USER_SUMMARY_SELECT } from '../users/users.select';
import { CreateMeetingDto, MeetingQueryDto, UpdateMeetingDto } from './dto/meeting.dto';
import { MAX_MEETING_RANGE_DAYS, MEETING_TYPE_LABELS, MeetingType } from './meeting.constants';

const MEETING_INCLUDE = {
  project: { select: { id: true, name: true, key: true, color: true } },
  createdBy: { select: USER_SUMMARY_SELECT },
} satisfies Prisma.MeetingInclude;

/** Reminders come from the system, never from a person, so no recipient is filtered out as the actor. */
const SYSTEM_ACTOR = 'system';
/** Meetings that start before the morning notice are announced this long before they start. */
const EARLY_NOTICE_MS = 60 * 60 * 1000;
const MAX_MEETING_MS = 24 * 60 * 60 * 1000;
const MIN_MEETING_YEAR = 2000;
const MAX_MEETING_YEAR = 2100;

@Injectable()
export class MeetingsService {
  private readonly digestHour: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
    private readonly events: EventPublisher,
    config: ConfigService<AppConfig, true>,
  ) {
    this.digestHour = config.get('meetings', { infer: true }).digestHour;
  }

  /** Meetings the user may see: organization-wide ones and those of projects they can open. */
  private visibleWhere(user: AuthenticatedUser): Prisma.MeetingWhereInput {
    return {
      organizationId: user.organizationId,
      OR: [{ projectId: null }, { project: this.access.visibleProjectsWhere(user) }],
    };
  }

  async findAll(user: AuthenticatedUser, query: MeetingQueryDto) {
    if (query.to < query.from) throw new BadRequestException('The end of the range must be after its start');
    if (query.to.getTime() - query.from.getTime() > MAX_MEETING_RANGE_DAYS * 86_400_000) {
      throw new BadRequestException(`Load at most ${MAX_MEETING_RANGE_DAYS} days at a time`);
    }
    if (query.projectId) await this.access.assertCanView(user, query.projectId);
    return this.prisma.meeting.findMany({
      where: {
        AND: [
          this.visibleWhere(user),
          { startsAt: { lt: query.to }, endsAt: { gt: query.from } },
          query.projectId ? { OR: [{ projectId: null }, { projectId: query.projectId }] } : {},
        ],
      },
      include: MEETING_INCLUDE,
      orderBy: { startsAt: 'asc' },
    });
  }

  async findOne(user: AuthenticatedUser, id: string) {
    const meeting = await this.prisma.meeting.findFirst({ where: { AND: [{ id }, this.visibleWhere(user)] }, include: MEETING_INCLUDE });
    if (!meeting) throw new NotFoundException('Meeting not found');
    return meeting;
  }

  async create(user: AuthenticatedUser, dto: CreateMeetingDto) {
    this.assertTimes(dto.startsAt, dto.endsAt);
    if (dto.projectId) await this.assertProjectWritable(user, dto.projectId);
    const meeting = await this.prisma.meeting.create({
      data: {
        organizationId: user.organizationId,
        projectId: dto.projectId ?? null,
        title: dto.title,
        description: dto.description ?? null,
        type: dto.type,
        link: dto.link,
        startsAt: dto.startsAt,
        endsAt: dto.endsAt,
        createdById: user.id,
      },
      include: MEETING_INCLUDE,
    });
    // A meeting added for today after the morning notice went out is announced right away.
    await this.sendReminders(user.organizationId, meeting.id);
    return meeting;
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateMeetingDto) {
    const meeting = await this.findOne(user, id);
    const startsAt = dto.startsAt ?? meeting.startsAt;
    this.assertTimes(startsAt, dto.endsAt ?? meeting.endsAt);
    if (meeting.projectId) await this.assertProjectWritable(user, meeting.projectId);
    if (dto.projectId) await this.assertProjectWritable(user, dto.projectId);
    // A new time, audience or link is announced again so the right people get the right details.
    const announceAgain =
      startsAt.getTime() !== meeting.startsAt.getTime() ||
      (dto.projectId !== undefined && dto.projectId !== meeting.projectId) ||
      (dto.link !== undefined && dto.link !== meeting.link);
    await this.prisma.meeting.update({
      where: { id },
      data: { ...dto, ...(announceAgain ? { reminderSentAt: null } : {}) },
    });
    if (announceAgain) await this.sendReminders(user.organizationId, id);
    return this.findOne(user, id);
  }

  async remove(user: AuthenticatedUser, id: string): Promise<void> {
    const meeting = await this.findOne(user, id);
    if (meeting.projectId) await this.assertProjectWritable(user, meeting.projectId);
    await this.prisma.meeting.delete({ where: { id } });
  }

  /**
   * Sends the notice for today's meetings that have not been announced yet: at the start of the day
   * (`digestHour`, organization time), or an hour before the meeting when it starts earlier than that.
   * Pass `meetingId` to check a single meeting.
   */
  async sendReminders(organizationId: string, meetingId?: string, now = new Date(), digestHour = this.digestHour): Promise<void> {
    const organization = await this.prisma.organization.findUnique({ where: { id: organizationId }, select: { timezone: true, isActive: true } });
    if (!organization?.isActive) return;
    const afterDigest = localHour(organization.timezone, now) >= digestHour;

    const today = todayInTimezone(organization.timezone, now).getTime();
    // Local "today" always lies within a day and a half of now, whatever the time zone.
    const meetings = await this.prisma.meeting.findMany({
      where: {
        organizationId,
        reminderSentAt: null,
        endsAt: { gt: now },
        startsAt: { gte: addDays(now, -1.5), lte: addDays(now, 1.5) },
        ...(meetingId ? { id: meetingId } : {}),
      },
      include: { project: { select: { name: true, members: { where: { user: { isActive: true } }, select: { userId: true } } } } },
    });
    const dueToday = meetings.filter(
      (meeting) =>
        todayInTimezone(organization.timezone, meeting.startsAt).getTime() === today &&
        (afterDigest || meeting.startsAt.getTime() - now.getTime() <= EARLY_NOTICE_MS),
    );
    if (!dueToday.length) return;

    const everyone = dueToday.some((meeting) => !meeting.project)
      ? (await this.prisma.user.findMany({ where: { organizationId, isActive: true }, select: { id: true } })).map((u) => u.id)
      : [];
    for (const meeting of dueToday) {
      // The person who scheduled it is told too, even when they are not a member of the project.
      const recipientIds = meeting.project ? [...meeting.project.members.map((member) => member.userId), meeting.createdById] : everyone;
      this.events.notify({
        recipientIds,
        actorId: SYSTEM_ACTOR,
        type: NotificationType.MEETING_TODAY,
        title: `Today ${formatTime(meeting.startsAt, organization.timezone)} · ${meeting.title}`,
        body: `${MEETING_TYPE_LABELS[meeting.type as MeetingType] ?? 'Meeting'}${meeting.project ? ` · ${meeting.project.name}` : ''} · ${meeting.link}`,
        link: NotificationLinks.calendar(todayInTimezone(organization.timezone, meeting.startsAt).toISOString().slice(0, 10)),
      });
    }
    await this.prisma.meeting.updateMany({ where: { id: { in: dueToday.map((m) => m.id) } }, data: { reminderSentAt: now } });
  }

  private assertTimes(startsAt: Date, endsAt: Date): void {
    if (endsAt <= startsAt) throw new BadRequestException('The meeting must end after it starts');
    if (endsAt.getTime() - startsAt.getTime() > MAX_MEETING_MS) throw new BadRequestException('A meeting can last at most 24 hours');
    const years = [startsAt.getUTCFullYear(), endsAt.getUTCFullYear()];
    if (years.some((year) => year < MIN_MEETING_YEAR || year > MAX_MEETING_YEAR)) {
      throw new BadRequestException(`Pick a date between ${MIN_MEETING_YEAR} and ${MAX_MEETING_YEAR}`);
    }
  }

  /** Meetings follow the project: visible to the user and not archived (archived projects are read-only). */
  private async assertProjectWritable(user: AuthenticatedUser, projectId: string): Promise<void> {
    const { project } = await this.access.assertCanView(user, projectId);
    if (project.isArchived) throw new BadRequestException('Archived projects are read-only');
  }
}

function localHour(timezone: string, now: Date): number {
  try {
    return Number(new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', hourCycle: 'h23' }).format(now));
  } catch {
    return now.getUTCHours();
  }
}

function formatTime(date: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);
  } catch {
    return date.toISOString().slice(11, 16);
  }
}
