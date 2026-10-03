import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Permission } from '../../common/constants/permissions.constants';
import { PlatformOnly } from '../../common/decorators/account-scope.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CreateSubscriptionDto, SubscriptionQueryDto, UpdateSubscriptionDto } from './dto/subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

/** Root-only management of every organization's subscriptions. */
@ApiTags('Platform · Subscriptions')
@Controller('platform/subscriptions')
@PlatformOnly()
@RequirePermissions(Permission.PLATFORM_MANAGE)
export class PlatformSubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get()
  findAll(@Query() query: SubscriptionQueryDto) {
    return this.subscriptions.findAll(query);
  }

  @Post()
  create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptions.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSubscriptionDto) {
    return this.subscriptions.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.subscriptions.remove(id);
  }
}

/** Read-only view of the signed-in organization's own subscription. */
@ApiTags('Subscription')
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get()
  @RequirePermissions(Permission.SUBSCRIPTION_VIEW)
  current(@CurrentUser('organizationId') organizationId: string) {
    return this.subscriptions.overview(organizationId);
  }
}
