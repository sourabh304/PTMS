import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationService } from '../../common/pagination/pagination.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationQueryDto } from './dto/notification-query.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pagination: PaginationService,
  ) {}

  async findAll(userId: string, query: NotificationQueryDto) {
    const page = this.pagination.resolve(query.page, query.limit);
    const where = { userId, ...(query.unreadOnly ? { readAt: null } : {}) };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip: page.skip, take: page.take }),
      this.prisma.notification.count({ where }),
    ]);
    return this.pagination.build(data, total, page);
  }

  async unreadCount(userId: string) {
    return { count: await this.prisma.notification.count({ where: { userId, readAt: null } }) };
  }

  async markRead(userId: string, id: string) {
    const { count } = await this.prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
    if (!count && !(await this.prisma.notification.count({ where: { id, userId } }))) {
      throw new NotFoundException('Notification not found');
    }
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
  }
}
