import { Module } from '@nestjs/common';
import { PlatformSubscriptionsController, SubscriptionController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  controllers: [PlatformSubscriptionsController, SubscriptionController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
