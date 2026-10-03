import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Permission } from '../../common/constants/permissions.constants';
import { PlatformOnly } from '../../common/decorators/account-scope.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PlatformService } from './platform.service';

@ApiTags('Platform')
@Controller('platform')
@PlatformOnly()
@RequirePermissions(Permission.PLATFORM_MANAGE)
export class PlatformController {
  constructor(private readonly platform: PlatformService) {}

  @Get('overview')
  overview() {
    return this.platform.overview();
  }
}
