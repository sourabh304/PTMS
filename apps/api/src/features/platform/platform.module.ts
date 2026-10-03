import { Module } from '@nestjs/common';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';

@Module({
  imports: [SubscriptionsModule],
  controllers: [PlatformController],
  providers: [PlatformService],
})
export class PlatformModule {}
