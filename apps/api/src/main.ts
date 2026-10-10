import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createApp } from './app.setup';
import { AppConfig } from './config/configuration';

async function bootstrap() {
  const app = await createApp();
  const appConfig = app.get(ConfigService<AppConfig, true>).get('app', { infer: true });

  await app.listen(appConfig.port);
  const logger = new Logger('Bootstrap');
  logger.log(`${appConfig.name} API listening on http://localhost:${appConfig.port}/${appConfig.apiPrefix}`);
  if (appConfig.swaggerEnabled) {
    logger.log(`API docs available at http://localhost:${appConfig.port}/${appConfig.apiPrefix}/docs`);
  }
}

void bootstrap();
