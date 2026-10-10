import { Controller, Get, Headers, HttpCode, HttpStatus, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import { timingSafeEqual } from 'node:crypto';
import { AccountScope, ForAccounts } from '../../common/decorators/account-scope.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AppConfig } from '../../config/configuration';
import { MeetingRemindersService } from '../meetings/meeting-reminders.service';
import { DueRemindersService } from '../notifications/due-reminders.service';

/**
 * Scheduled jobs for serverless hosting, where the in-process timers do not run. Vercel Cron calls
 * this once a day (see apps/api/vercel.json) with `Authorization: Bearer <CRON_SECRET>`.
 */
@ApiExcludeController()
@Controller('cron')
@Public()
@ForAccounts(AccountScope.ANY)
export class CronController {
  constructor(
    private readonly config: ConfigService<AppConfig, true>,
    private readonly dueReminders: DueRemindersService,
    private readonly meetingReminders: MeetingRemindersService,
  ) {}

  @Get('daily')
  @HttpCode(HttpStatus.NO_CONTENT)
  async daily(@Headers('authorization') authorization?: string): Promise<void> {
    const secret = this.config.get('cron', { infer: true }).secret;
    if (!secret) throw new NotFoundException();
    const expected = Buffer.from(`Bearer ${secret}`);
    const given = Buffer.from(authorization ?? '');
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) throw new UnauthorizedException();

    await this.dueReminders.run();
    // Once a day, so every meeting of the day is announced now rather than at MEETING_DIGEST_HOUR.
    await this.meetingReminders.run(new Date(), 0);
  }
}
